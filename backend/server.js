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

// Import middleware
import { notFound, errorHandler } from './middleware/error.js';
import { corsConfig, securityHeaders, mongoSanitizeData, preventXSS, preventHPP, requestLogger } from './middleware/security.js';
import { generalLimiter, speedLimiter } from './middleware/rateLimit.js';
import { cacheMiddleware } from './middleware/cache.js';

// Import routes
import routes from './routes/index.js';

// Import cron jobs
import { publishScheduledPosts } from './cron/scheduledPosts.js';
import { sendWeeklyDigest } from './cron/weeklyDigest.js';
import { cleanupOldData } from './cron/cleanup.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-cms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin user if none exists
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
        emailVerified: true
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
app.use(compression());

// Rate limiting
app.use(generalLimiter);
app.use(speedLimiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Serve static files
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.io for real-time features
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
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
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