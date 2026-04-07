// API Gateway - Routes
// Defines all API endpoints and routes them to microservices

const express = require('express');
const { proxyRequest, callService } = require('../utils/serviceClient');
const { authenticateToken, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================
// HEALTH CHECK & STATUS
// ============================================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// AUTH ENDPOINTS
// ============================================================

// Public routes
router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'AUTH_SERVICE', '/register');
  })
);

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'AUTH_SERVICE', '/login');
  })
);

router.post(
  '/auth/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'AUTH_SERVICE', '/logout');
  })
);

router.post(
  '/auth/refresh-token',
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'AUTH_SERVICE', '/refresh-token');
  })
);

// ============================================================
// USER ENDPOINTS
// ============================================================

// Get current user profile
router.get(
  '/users/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', '/profile');
  })
);

// Update user profile
router.put(
  '/users/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', '/profile');
  })
);

// Get all addresses
router.get(
  '/users/addresses',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', '/addresses');
  })
);

// Add new address
router.post(
  '/users/addresses',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', '/addresses');
  })
);

// Update specific address
router.put(
  '/users/addresses/:addressId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', `/addresses/${req.params.addressId}`);
  })
);

// Delete specific address
router.delete(
  '/users/addresses/:addressId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', `/addresses/${req.params.addressId}`);
  })
);

// Set default address
router.put(
  '/users/addresses/:addressId/set-default',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', `/addresses/${req.params.addressId}/set-default`);
  })
);

// Get specific user (admin only)
router.get(
  '/users/:userId',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'USER_SERVICE', `/${req.params.userId}`);
  })
);

// ============================================================
// MEDICINE ENDPOINTS
// ============================================================

// Get all medicines (public, cached)
router.get(
  '/medicines',
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'MEDICINE_SERVICE', '');
  })
);

// Search medicines (must come before /:id)
router.get(
  '/medicines/search',
  asyncHandler(async (req, res) => {
    const queryString = Object.keys(req.query)
      .map((key) => `${key}=${req.query[key]}`)
      .join('&');
    await proxyRequest(
      req,
      res,
      'MEDICINE_SERVICE',
      `/search?${queryString}`
    );
  })
);

// Get single medicine (public, cached)
router.get(
  '/medicines/:id',
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'MEDICINE_SERVICE', `/${req.params.id}`);
  })
);

// Create medicine (admin/pharmacist only)
router.post(
  '/medicines',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'MEDICINE_SERVICE', '');
  })
);

// Update medicine (admin/pharmacist only)
router.put(
  '/medicines/:id',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'MEDICINE_SERVICE', `/${req.params.id}`);
  })
);

// Delete medicine (admin only)
router.delete(
  '/medicines/:id',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'MEDICINE_SERVICE', `/${req.params.id}`);
  })
);

// ============================================================
// PRESCRIPTION ENDPOINTS
// ============================================================

// Upload prescription (with file)
router.post(
  '/prescriptions/upload',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'PRESCRIPTION_SERVICE', '/prescriptions/upload');
  })
);

// Get user prescriptions
router.get(
  '/prescriptions',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'PRESCRIPTION_SERVICE', '/prescriptions');
  })
);

// Get pending prescriptions (admin/pharmacist)
router.get(
  '/prescriptions/pending/all',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'PRESCRIPTION_SERVICE', '/prescriptions/pending/all');
  })
);

// Get prescription by ID
router.get(
  '/prescriptions/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'PRESCRIPTION_SERVICE', `/prescriptions/${req.params.id}`);
  })
);

// Approve prescription (admin/pharmacist only)
router.put(
  '/prescriptions/:id/approve',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'PRESCRIPTION_SERVICE', `/prescriptions/${req.params.id}/approve`);
  })
);

// Reject prescription (admin/pharmacist only)
router.put(
  '/prescriptions/:id/reject',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'PRESCRIPTION_SERVICE', `/prescriptions/${req.params.id}/reject`);
  })
);

// ============================================================
// ORDER ENDPOINTS
// ============================================================

// Create order
router.post(
  '/orders',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', '');
  })
);

// Get all orders (admin only - must come before /:id)
router.get(
  '/orders/admin/all',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', '/admin/all');
  })
);

// Get user orders
router.get(
  '/orders',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', '');
  })
);

// Get order by ID
router.get(
  '/orders/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', `/${req.params.id}`);
  })
);

// Pay order
router.put(
  '/orders/:id/pay',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', `/${req.params.id}/pay`);
  })
);

// Cancel order
router.put(
  '/orders/:id/cancel',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', `/${req.params.id}/cancel`);
  })
);

// Refund order (admin only)
router.post(
  '/orders/:id/refund',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', `/${req.params.id}/refund`);
  })
);

// Update order status (admin only)
router.put(
  '/orders/:id/status',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'ORDER_SERVICE', `/${req.params.id}/status`);
  })
);

// ============================================================
// DELIVERY ENDPOINTS
// ============================================================

// Get delivery status for an order
router.get(
  '/deliveries/order/:orderId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'DELIVERY_SERVICE', `/deliveries/order/${req.params.orderId}`);
  })
);

// Get specific delivery by ID
router.get(
  '/deliveries/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'DELIVERY_SERVICE', `/deliveries/${req.params.id}`);
  })
);

// Get all deliveries for delivery agent
router.get(
  '/deliveries/agent/my-deliveries',
  authenticateToken,
  authorize('delivery_agent'),
  asyncHandler(async (req, res) => {
    const queryString = Object.keys(req.query)
      .map((key) => `${key}=${req.query[key]}`)
      .join('&');
    await proxyRequest(
      req,
      res,
      'DELIVERY_SERVICE',
      `/deliveries/agent/my-deliveries${queryString ? '?' + queryString : ''}`
    );
  })
);

// Update delivery status (delivery agent or admin)
router.put(
  '/deliveries/:id/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'DELIVERY_SERVICE', `/deliveries/${req.params.id}/status`);
  })
);

// Assign delivery agent (admin only)
router.put(
  '/deliveries/:id/assign',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'DELIVERY_SERVICE', `/deliveries/${req.params.id}/assign`);
  })
);

// Get all deliveries (admin only)
router.get(
  '/deliveries/admin/all',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const queryString = Object.keys(req.query)
      .map((key) => `${key}=${req.query[key]}`)
      .join('&');
    await proxyRequest(
      req,
      res,
      'DELIVERY_SERVICE',
      `/deliveries/admin/all${queryString ? '?' + queryString : ''}`
    );
  })
);

// Get delivery statistics (admin only)
router.get(
  '/deliveries/admin/stats',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(req, res, 'DELIVERY_SERVICE', `/deliveries/admin/stats`);
  })
);

// Get agent metrics (admin only)
router.get(
  '/deliveries/admin/agent/:agentId/metrics',
  authenticateToken,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await proxyRequest(
      req,
      res,
      'DELIVERY_SERVICE',
      `/deliveries/admin/agent/${req.params.agentId}/metrics`
    );
  })
);

module.exports = router;
