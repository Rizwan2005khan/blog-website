import mongoose from 'mongoose';
import { createClient } from 'redis';

// MongoDB Connection
export const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    });

    return conn;

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Redis Connection (Optional - for advanced caching)
export const connectRedis = async () => {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Connected to Redis');
    });

    await client.connect();
    return client;

  } catch (error) {
    console.error('Redis connection error:', error);
    // Don't throw error - Redis is optional
    return null;
  }
};

// Database Health Check
export const checkDatabaseHealth = async () => {
  const health = {
    mongodb: false,
    redis: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.mongodb = true;
    }
  } catch (error) {
    console.error('MongoDB health check failed:', error);
  }

  try {
    // Check Redis if available
    if (global.redisClient) {
      await global.redisClient.ping();
      health.redis = true;
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  return health;
};

// Connection Pool Monitoring
export const monitorConnectionPool = () => {
  if (mongoose.connection.readyState === 1) {
    const poolStats = {
      totalConnections: mongoose.connection.readyState,
      availableConnections: mongoose.connection.readyState,
      pendingConnections: 0,
      activeConnections: mongoose.connection.readyState
    };

    console.log('MongoDB Connection Pool Stats:', poolStats);
    return poolStats;
  }
  return null;
};