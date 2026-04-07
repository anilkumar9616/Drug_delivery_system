const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

/**
 * Health check endpoint
 */
router.get('/health', userController.health);

/**
 * User profile routes
 * All require authentication
 */

// Get current user's profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update current user's profile
router.put('/profile', authMiddleware, userController.updateProfile);

/**
 * User addresses routes
 * All require authentication
 */

// Get all addresses for current user
router.get('/addresses', authMiddleware, userController.getAddresses);

// Add new address
router.post('/addresses', authMiddleware, userController.addAddress);

// Update specific address
router.put('/addresses/:addressId', authMiddleware, userController.updateAddress);

// Delete specific address
router.delete('/addresses/:addressId', authMiddleware, userController.deleteAddress);

// Set default address
router.put('/addresses/:addressId/set-default', authMiddleware, userController.setDefaultAddress);

/**
 * Admin-only routes
 */

// Get specific user (admin only)
router.get('/:userId', authMiddleware, userController.getUserById);

module.exports = router;
