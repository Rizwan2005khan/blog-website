import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Speed limiter (slows down requests)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests without delay
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
});

// Post creation rate limiter
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 posts per hour
  message: {
    success: false,
    message: 'Too many posts created, please try again later.'
  },
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  }
});

// Comment rate limiter
export const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 comments per 15 minutes
  message: {
    success: false,
        message: 'Too many comments posted, please try again later.'
  },
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for authenticated users with approved comments
    return req.user && req.user.role !== 'author';
  }
});

// Newsletter subscription rate limiter
export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 subscriptions per hour
  message: {
    success: false,
    message: 'Too many subscription attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

// API key rate limiter (for future API key authentication)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each API key to 60 requests per minute
  message: {
    success: false,
    message: 'API rate limit exceeded'
  },
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  }
});