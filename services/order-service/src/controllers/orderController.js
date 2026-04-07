const orderService = require('../services/orderService');
const logger = require('../../../../shared/logger');

/**
 * Create new order
 * POST /api/orders
 * Body: { items: [{ medicine_id, quantity }], shipping_address_id, idempotency_key }
 */
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, shipping_address_id, idempotency_key } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
        code: 'INVALID_ITEMS'
      });
    }

    if (!shipping_address_id) {
      return res.status(400).json({
        success: false,
        error: 'shipping_address_id is required',
        code: 'MISSING_ADDRESS'
      });
    }

    if (!idempotency_key) {
      return res.status(400).json({
        success: false,
        error: 'idempotency_key is required to prevent duplicate orders',
        code: 'MISSING_IDEMPOTENCY_KEY'
      });
    }

    // Validate items format
    for (const item of items) {
      if (!item.medicine_id || !item.quantity) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have medicine_id and quantity',
          code: 'INVALID_ITEM_FORMAT'
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be greater than 0',
          code: 'INVALID_QUANTITY'
        });
      }
    }

    const order = await orderService.createOrder({
      userId,
      items,
      shippingAddressId: shipping_address_id,
      idempotencyKey: idempotency_key
    });

    logger.info(`Order created: ${order.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully. Proceed to payment.'
    });
  } catch (error) {
    logger.error(`Error creating order: ${error.message}`);
    
    // Handle specific errors
    if (error.message.includes('Insufficient stock')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INSUFFICIENT_STOCK'
      });
    }

    if (error.message.includes('Duplicate')) {
      return res.status(409).json({
        success: false,
        error: 'Order with this idempotency key already exists',
        code: 'DUPLICATE_ORDER'
      });
    }

    next(error);
  }
};

/**
 * Get user's orders
 * GET /api/orders
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;

    const result = await orderService.getUserOrders(userId, {
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    logger.info(`Retrieved ${result.orders.length} orders for user ${userId}`);

    res.json({
      success: true,
      data: result.orders,
      count: result.orders.length,
      total: result.total,
      page: Math.floor((offset || 0) / (limit || 50)) + 1
    });
  } catch (error) {
    logger.error(`Error fetching user orders: ${error.message}`);
    next(error);
  }
};

/**
 * Get specific order
 * GET /api/orders/:orderId
 */
exports.getOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Users can only view their own orders (unless admin)
    if (req.user.role !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this order',
        code: 'FORBIDDEN'
      });
    }

    logger.info(`Retrieved order ${orderId}`);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error(`Error fetching order: ${error.message}`);
    next(error);
  }
};

/**
 * Process payment for order
 * PUT /api/orders/:orderId/pay
 * Body: { payment_method, transaction_id }
 */
exports.payOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { payment_method, transaction_id } = req.body;

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        error: 'payment_method is required',
        code: 'MISSING_PAYMENT_METHOD'
      });
    }

    const order = await orderService.processPayment({
      orderId,
      userId,
      paymentMethod: payment_method,
      transactionId: transaction_id
    });

    logger.info(`Payment processed for order ${orderId}`);

    res.json({
      success: true,
      data: order,
      message: 'Payment successful. Order confirmed.'
    });
  } catch (error) {
    logger.error(`Error processing payment: ${error.message}`);

    if (error.message.includes('not found') || error.message.includes('Order')) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (error.message.includes('already paid') || error.message.includes('Already')) {
      return res.status(409).json({
        success: false,
        error: 'Order has already been paid',
        code: 'ALREADY_PAID'
      });
    }

    if (error.message.includes('Payment failed')) {
      return res.status(402).json({
        success: false,
        error: error.message,
        code: 'PAYMENT_FAILED'
      });
    }

    next(error);
  }
};

/**
 * Cancel order
 * PUT /api/orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await orderService.cancelOrder(orderId, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    logger.info(`Order cancelled: ${orderId}`);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    logger.error(`Error cancelling order: ${error.message}`);

    if (error.message.includes('Cannot cancel')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'CANNOT_CANCEL'
      });
    }

    next(error);
  }
};

/**
 * Refund order (admin only)
 * POST /api/orders/:orderId/refund
 */
exports.refundOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderService.refundOrder(orderId, reason);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    logger.info(`Order refunded: ${orderId}`);

    res.json({
      success: true,
      data: order,
      message: 'Order refunded successfully'
    });
  } catch (error) {
    logger.error(`Error refunding order: ${error.message}`);
    next(error);
  }
};

/**
 * Update order status (admin only)
 * PUT /api/orders/:orderId/status
 * Body: { status }
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required',
        code: 'MISSING_STATUS'
      });
    }

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    const order = await orderService.updateOrderStatus(orderId, status);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    logger.info(`Order status updated: ${orderId} -> ${status}`);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated'
    });
  } catch (error) {
    logger.error(`Error updating order status: ${error.message}`);
    next(error);
  }
};

/**
 * Get all orders (admin only)
 * GET /api/orders/admin/all
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;

    const result = await orderService.getAllOrders({
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    logger.info(`Admin retrieved ${result.orders.length} orders`);

    res.json({
      success: true,
      data: result.orders,
      count: result.orders.length,
      total: result.total,
      page: Math.floor((offset || 0) / (limit || 50)) + 1
    });
  } catch (error) {
    logger.error(`Error fetching all orders: ${error.message}`);
    next(error);
  }
};

/**
 * Health check
 */
exports.health = (req, res) => {
  res.json({
    service: 'order-service',
    status: 'up',
    timestamp: new Date().toISOString()
  });
};
