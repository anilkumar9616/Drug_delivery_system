const userService = require('../services/userService');
const logger = require('../../../../shared/logger');

/**
 * Get current user's profile
 * GET /api/users/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Set by API Gateway auth middleware
    
    const user = await userService.getProfile(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info(`Profile retrieved for user ${userId}`);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Error fetching profile: ${error.message}`);
    next(error);
  }
};

/**
 * Update current user's profile
 * PUT /api/users/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    // Validate input
    if (name && name.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters',
        code: 'INVALID_NAME'
      });
    }

    if (phone && !/^\+?[0-9\s\-\(\)]{7,}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format',
        code: 'INVALID_PHONE'
      });
    }

    const updated = await userService.updateProfile(userId, { name, phone });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info(`Profile updated for user ${userId}`);
    
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    next(error);
  }
};

/**
 * Get all addresses for current user
 * GET /api/users/addresses
 */
exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const addresses = await userService.getAddresses(userId);
    
    logger.info(`Addresses retrieved for user ${userId}`);
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    logger.error(`Error fetching addresses: ${error.message}`);
    next(error);
  }
};

/**
 * Add new address for current user
 * POST /api/users/addresses
 */
exports.addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { street, city, state, postal_code, country, is_default } = req.body;

    // Validate required fields
    if (!street || !city || !postal_code || !country) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: street, city, postal_code, country',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate postal code format
    if (!/^[A-Z0-9\s\-]{3,10}$/i.test(postal_code)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid postal code format',
        code: 'INVALID_POSTAL_CODE'
      });
    }

    const address = await userService.addAddress(userId, {
      street,
      city,
      state: state || null,
      postal_code,
      country,
      is_default: is_default || false
    });

    logger.info(`Address added for user ${userId}`);
    
    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    logger.error(`Error adding address: ${error.message}`);
    next(error);
  }
};

/**
 * Update specific address
 * PUT /api/users/addresses/:addressId
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const { street, city, state, postal_code, country } = req.body;

    // Validate postal code if provided
    if (postal_code && !/^[A-Z0-9\s\-]{3,10}$/i.test(postal_code)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid postal code format',
        code: 'INVALID_POSTAL_CODE'
      });
    }

    const address = await userService.updateAddress(userId, addressId, {
      street,
      city,
      state,
      postal_code,
      country
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
        code: 'ADDRESS_NOT_FOUND'
      });
    }

    logger.info(`Address ${addressId} updated for user ${userId}`);
    
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    logger.error(`Error updating address: ${error.message}`);
    next(error);
  }
};

/**
 * Delete specific address
 * DELETE /api/users/addresses/:addressId
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const deleted = await userService.deleteAddress(userId, addressId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
        code: 'ADDRESS_NOT_FOUND'
      });
    }

    logger.info(`Address ${addressId} deleted for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting address: ${error.message}`);
    next(error);
  }
};

/**
 * Set default address
 * PUT /api/users/addresses/:addressId/set-default
 */
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const address = await userService.setDefaultAddress(userId, addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
        code: 'ADDRESS_NOT_FOUND'
      });
    }

    logger.info(`Default address set to ${addressId} for user ${userId}`);
    
    res.json({
      success: true,
      data: address,
      message: 'Default address updated'
    });
  } catch (error) {
    logger.error(`Error setting default address: ${error.message}`);
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * GET /api/users/:userId
 */
exports.getUserById = async (req, res, next) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can view other users',
        code: 'FORBIDDEN'
      });
    }

    const { userId } = req.params;
    const user = await userService.getProfile(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info(`Admin ${req.user.id} retrieved user ${userId}`);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    next(error);
  }
};

/**
 * Health check for service
 * GET /health
 */
exports.health = (req, res) => {
  res.json({
    service: 'user-service',
    status: 'up',
    timestamp: new Date().toISOString()
  });
};
