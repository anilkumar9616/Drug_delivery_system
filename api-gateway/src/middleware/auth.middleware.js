// API Gateway - Authentication Middleware
// Validates JWT tokens and attaches user context to requests

const jwt = require('jsonwebtoken');
const redis = require('redis');

// Initialize Redis client for JWT blacklist
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Helper to verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Check if token is blacklisted (happens on logout)
const isTokenBlacklisted = async (token) => {
  try {
    const result = await redisClient.get(`blacklist:${token}`);
    return result !== null;
  } catch (error) {
    console.error('Redis error checking blacklist:', error);
    return false; // If Redis fails, allow request (fail-open)
  }
};

// Middleware to authenticate JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'MISSING_TOKEN',
      });
    }

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED',
      });
    }

    // Verify token signature and expiry
    const decoded = verifyToken(token);

    // Attach user context to request
    req.user = {
      id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    req.token = token; // Store token for potential logout

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

// Middleware to authorize based on roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const blacklisted = await isTokenBlacklisted(token);
      if (!blacklisted) {
        const decoded = verifyToken(token);
        req.user = {
          id: decoded.user_id,
          email: decoded.email,
          role: decoded.role,
        };
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Gracefully ignore auth errors for optional auth
    next();
  }
};

// Helper to blacklist token (used on logout)
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    const expiryTime = decoded.exp - Math.floor(Date.now() / 1000); // Time until expiry
    
    if (expiryTime > 0) {
      await redisClient.setex(`blacklist:${token}`, expiryTime, 'true');
    }
  } catch (error) {
    console.error('Error blacklisting token:', error);
  }
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuthentication,
  blacklistToken,
  verifyToken,
};
