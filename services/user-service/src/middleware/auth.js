const jwt = require('jsonwebtoken');
const logger = require('../../../../shared/logger');

/**
 * Verify JWT token from API Gateway
 * The API Gateway already validates the token, but we verify it here too
 * for security and to extract user info
 */
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};
