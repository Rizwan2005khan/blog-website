import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';


export const corsConfig = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  // Debug logging
  console.log(`[CORS Debug] Origin: ${origin}`);
  console.log(`[CORS Debug] Allowed origins:`, allowedOrigins);
  console.log(`[CORS Debug] Method: ${req.method}`);
  console.log(`[CORS Debug] Path: ${req.path}`);

  // Allow requests with no origin (like mobile apps or curl)
  if (!origin) {
    return next();
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(200);
    }
    
    return next();
  }

  // Log CORS rejection
  console.log(`[CORS Debug] REJECTED: Origin ${origin} not in allowed list`);
  
  // For preflight requests that are rejected, send proper response
  if (req.method === 'OPTIONS') {
    return res.status(403).json({
      error: 'CORS policy: This origin is not allowed',
      origin: origin,
      allowed: allowedOrigins
    });
  }
  
  // For regular requests, continue (browser will block them)
  next();
};

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:"], // allow WebSocket for socket.io
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "same-origin" },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
  ieNoOpen: true,
  hidePoweredBy: true
});

// MongoDB injection prevention
export const mongoSanitizeData = mongoSanitize();

// XSS protection
export const preventXSS = xss();

// HTTP Parameter Pollution prevention
export const preventHPP = hpp();

// Request logger
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${req.ip}`);
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
};
