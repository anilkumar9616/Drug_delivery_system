const jwt = require('jsonwebtoken');
const logger = require('../../../../shared/logger');

/**
 * Authenticate JWT token and attach user info to request
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn(`Token verification failed: ${err.message}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }

      // Attach user info to request
      req.user = {
        id: decoded.user_id,
        email: decoded.email,
        roles: decoded.roles || ['user']
      };

      next();
    });
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = authenticateToken;
