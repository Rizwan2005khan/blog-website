import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Console format (colored for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  logFormat
);

// Create logs directory if it doesn't exist
import { promises as fs } from 'fs';
const logsDir = path.join(__dirname, '../logs');
try {
  await fs.mkdir(logsDir, { recursive: true });
} catch (error) {
  console.error('Failed to create logs directory:', error);
}

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? consoleFormat : logFormat,
      handleExceptions: true,
      handleRejections: true
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // HTTP access log file
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Exit on error
  exitOnError: false
});

// HTTP request logger
export const httpLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Database query logger
export const dbLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'database.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Error logger helper
export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  });
};

// Info logger helper
export const logInfo = (message, data = {}) => {
  logger.info({
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  });
};

// Warning logger helper
export const logWarning = (message, data = {}) => {
  logger.warn({
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  });
};

// Debug logger helper
export const logDebug = (message, data = {}) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug({
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    });
  }
};

// Database query logger
export const logDatabaseQuery = (collection, operation, query, duration) => {
  dbLogger.info({
    collection,
    operation,
    query: typeof query === 'object' ? JSON.stringify(query) : query,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
};

// HTTP request logger
export const logHttpRequest = (method, url, statusCode, duration, userAgent, ip) => {
  httpLogger.info({
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userAgent,
    ip,
    timestamp: new Date().toISOString()
  });
};

// Performance logger
export const logPerformance = (operation, duration, metadata = {}) => {
  logger.info({
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    metadata,
    timestamp: new Date().toISOString()
  });
};

// Security event logger
export const logSecurityEvent = (event, details = {}) => {
  logger.warn({
    type: 'security',
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// Create a stream object for Morgan to use
export const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Graceful shutdown
export const closeLogger = async () => {
  return new Promise((resolve) => {
    logger.end(() => {
      console.log('Logger closed');
      resolve();
    });
  });
};

export default logger;