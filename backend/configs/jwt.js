import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate secure JWT secrets if not provided
export const generateJWTSecrets = () => {
  const secrets = {
    access: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    refresh: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex')
  };
  
  // Log warning if using generated secrets
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('⚠️  Using generated JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET in .env for production.');
  }
  
  return secrets;
};

// JWT Configuration
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: 'HS256',
    issuer: process.env.SITE_NAME || 'Blog CMS',
    audience: process.env.SITE_URL || 'http://localhost:3000'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    algorithm: 'HS256',
    issuer: process.env.SITE_NAME || 'Blog CMS',
    audience: process.env.SITE_URL || 'http://localhost:3000'
  }
};

// Generate JWT tokens
export const generateTokens = (payload) => {
  const accessToken = jwt.sign(
    payload,
    jwtConfig.accessToken.secret,
    {
      expiresIn: jwtConfig.accessToken.expiresIn,
      algorithm: jwtConfig.accessToken.algorithm,
      issuer: jwtConfig.accessToken.issuer,
      audience: jwtConfig.accessToken.audience
    }
  );

  const refreshToken = jwt.sign(
    payload,
    jwtConfig.refreshToken.secret,
    {
      expiresIn: jwtConfig.refreshToken.expiresIn,
      algorithm: jwtConfig.refreshToken.algorithm,
      issuer: jwtConfig.refreshToken.issuer,
      audience: jwtConfig.refreshToken.audience
    }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token, type = 'access') => {
  try {
    const config = type === 'access' ? jwtConfig.accessToken : jwtConfig.refreshToken;
    return jwt.verify(token, config.secret, {
      algorithms: [config.algorithm],
      issuer: config.issuer,
      audience: config.audience
    });
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
};

// Generate secure random token
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Token blacklist (for logout functionality)
class TokenBlacklist {
  constructor() {
    this.blacklist = new Set();
  }

  add(token) {
    this.blacklist.add(token);
  }

  has(token) {
    return this.blacklist.has(token);
  }

  clear() {
    this.blacklist.clear();
  }

  size() {
    return this.blacklist.size;
  }
}

export const tokenBlacklist = new TokenBlacklist();

// Refresh token rotation
export const rotateRefreshToken = (oldRefreshToken, userId) => {
  try {
    // Verify old token first
    const payload = verifyToken(oldRefreshToken, 'refresh');
    
    // Blacklist old token
    tokenBlacklist.add(oldRefreshToken);
    
    // Generate new tokens
    return generateTokens({ userId });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Token cleanup (remove expired tokens from blacklist)
export const cleanupBlacklist = () => {
  const now = Math.floor(Date.now() / 1000);
  
  // This is a simplified cleanup - in production, you'd want to 
  // actually verify each token and remove expired ones
  if (tokenBlacklist.size() > 1000) {
    tokenBlacklist.clear();
    console.log('Token blacklist cleaned up');
  }
};

// Schedule cleanup every hour
setInterval(cleanupBlacklist, 60 * 60 * 1000);