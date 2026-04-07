const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authenticateToken = require('../middleware/auth');

// Health check
router.get('/health', deliveryController.health);

// Internal endpoint - Create delivery (called by Order Service)
router.post('/', deliveryController.createDelivery);

// Get delivery by order ID (user or admin)
router.get('/order/:orderId', authenticateToken, deliveryController.getDeliveryByOrder);

// Get specific delivery (user, agent, or admin)
router.get('/:id', authenticateToken, deliveryController.getDeliveryById);

// Get all deliveries for agent (delivery_agent)
router.get('/agent/my-deliveries', authenticateToken, deliveryController.getAgentDeliveries);

// Update delivery status (delivery agent or admin)
router.put('/:id/status', authenticateToken, deliveryController.updateDeliveryStatus);

// Assign agent to delivery (admin only)
router.put('/:id/assign', authenticateToken, deliveryController.assignDeliveryAgent);

// Get all deliveries (admin only)
router.get('/admin/all', authenticateToken, deliveryController.getAllDeliveries);

// Get delivery statistics (admin only)
router.get('/admin/stats', authenticateToken, deliveryController.getDeliveryStats);

// Get agent metrics (admin only)
router.get('/admin/agent/:agentId/metrics', authenticateToken, deliveryController.getAgentMetrics);

module.exports = router;
