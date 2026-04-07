const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * Health check endpoint
 */
router.get('/health', orderController.health);

/**
 * User endpoints (authenticated)
 */

// Create new order
router.post(
  '/',
  authenticateToken,
  orderController.createOrder
);

// Get user's orders
router.get(
  '/',
  authenticateToken,
  orderController.getUserOrders
);

// Get specific order
router.get(
  '/:orderId',
  authenticateToken,
  orderController.getOrder
);

// Process payment for order
router.put(
  '/:orderId/pay',
  authenticateToken,
  orderController.payOrder
);

// Cancel order (only if pending)
router.put(
  '/:orderId/cancel',
  authenticateToken,
  orderController.cancelOrder
);

/**
 * Admin endpoints
 */

// Get all orders (admin only)
router.get(
  '/admin/all',
  authenticateToken,
  authorize('admin'),
  orderController.getAllOrders
);

// Update order status (admin only)
router.put(
  '/:orderId/status',
  authenticateToken,
  authorize('admin'),
  orderController.updateOrderStatus
);

// Refund order (admin only)
router.post(
  '/:orderId/refund',
  authenticateToken,
  authorize('admin'),
  orderController.refundOrder
);

module.exports = router;
