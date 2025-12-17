import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import path from 'path';

// Middleware
import { notFound, errorHandler } from './middleware/error.js';
import {
  corsConfig,
  securityHeaders,
  mongoSanitizeData,
  preventXSS,
  preventHPP,
  requestLogger,
} from './middleware/security.js';
import { generalLimiter, speedLimiter } from './middleware/rateLimit.js';

// Routes
import routes from './routes/index.js';

// Cron jobs
import { publishScheduledPosts } from './cron/scheduledPosts.js';
import { sendWeeklyDigest } from './cron/weeklyDigest.js';
import { cleanupOldData } from './cron/cleanup.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-cms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await createDefaultAdmin();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = await import('./models/User.js');
    const adminExists = await User.default.findOne({ role: 'admin' });

    if (!adminExists) {
      const adminUser = await User.default.create({
        username: 'admin',
        email: 'admin@blog.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
      });

      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Email: admin@blog.com');
      console.log('Password: admin123');
      console.log('Please change the default password after first login!');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Security middleware
app.use(securityHeaders);
app.use(corsConfig);
app.use(mongoSanitizeData);
app.use(preventXSS);
app.use(preventHPP);
app.use(helmet());
app.use(compression());

// Rate limiting
app.use(generalLimiter);
app.use(speedLimiter);

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Optional: serve frontend React build (if exists)
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// Add this BEFORE your routes but AFTER express.json() middleware

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Detailed request logging for auth endpoints
app.use((req, res, next) => {
  if (req.path.includes('/auth/')) {
    console.log(`[Request Debug] ${req.method} ${req.path}`);
    console.log(`[Request Debug] Headers:`, req.headers);
    console.log(`[Request Debug] Body:`, req.body);
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  // If frontend exists, serve index.html
  const indexPath = path.join(__dirname, 'frontend', 'build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // fallback: redirect to API health check
      res.redirect('/api/health');
    }
  });
});

// API routes - MOVED BEFORE ERROR HANDLERS
app.use('/api', routes);

// CORS error handler - ADDED BEFORE MAIN ERROR HANDLER
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    console.error(`[CORS Error] ${err.message}`);
    return res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      origin: req.headers.origin
    });
  }
  next(err);
});

// Global error handling middleware - MOVED TO THE END
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] BACKEND ERROR:`);
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Status:', err.status || 500);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  if (req.method === 'POST' && req.path.includes('/auth/')) {
    console.error('Login Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Then your existing error handlers
app.use(notFound);
app.use(errorHandler);

// Socket.io real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-post', (postId) => {
    socket.join(`post-${postId}`);
  });

  socket.on('new-comment', (data) => {
    socket.to(`post-${data.postId}`).emit('comment-added', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cron jobs
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled posts cron job...');
  try {
    await publishScheduledPosts();
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

cron.schedule('0 9 * * 1', async () => {
  console.log('Running weekly digest cron job...');
  try {
    await sendWeeklyDigest();
  } catch (error) {
    console.error('Weekly digest cron job error:', error);
  }
});

cron.schedule('0 2 * * *', async () => {
  console.log('Running cleanup cron job...');
  try {
    await cleanupOldData();
  } catch (error) {
    console.error('Cleanup cron job error:', error);
  }
});

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => {
    console.log(`${sig} signal received: closing HTTP server`);
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for real-time features`);
      console.log(`⏰ Cron jobs scheduled`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };