import NodeCache from 'node-cache';
import crypto from 'crypto';

// Create cache instance
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every minute
  useClones: false
});

// Generate cache key
const generateCacheKey = (req) => {
  const parts = [
    req.method,
    req.originalUrl,
    JSON.stringify(req.query),
    JSON.stringify(req.body)
  ];
  
  if (req.user) {
    parts.push(req.user.id);
    parts.push(req.user.role);
  }
  
  return crypto.createHash('md5').update(parts.join(':')).digest('hex');
};

// Cache middleware
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip cache for authenticated users with certain roles
    if (req.user && ['admin', 'editor'].includes(req.user.role)) {
      return next();
    }

    const key = generateCacheKey(req);
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Clear cache for specific patterns
export const clearCache = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
};

// Clear cache middleware
export const clearCacheMiddleware = (patterns = []) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    res.json = function(data) {
      // Clear specified cache patterns
      patterns.forEach(pattern => {
        clearCache(pattern);
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation by route
export const invalidateCache = (req, res, next) => {
  const route = req.originalUrl.split('?')[0];
  
  // Clear cache for this route and related routes
  const patterns = [
    route,
    route.replace(/\/\w+$/, ''), // Parent route
    route + '/*' // Child routes
  ];
  
  patterns.forEach(pattern => {
    clearCache(pattern);
  });
  
  next();
};

// Cache statistics
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};