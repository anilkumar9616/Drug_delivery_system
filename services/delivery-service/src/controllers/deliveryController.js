const deliveryService = require('../services/deliveryService');
const logger = require('../../../../shared/logger');

/**
 * Create delivery record for an order
 * Called by Order Service when order status changes to 'shipped'
 */
exports.createDelivery = async (req, res, next) => {
  try {
    const { order_id, delivery_address, estimated_delivery_date } = req.body;

    // Validation
    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required',
        code: 'MISSING_ORDER_ID'
      });
    }

    if (!delivery_address) {
      return res.status(400).json({
        success: false,
        error: 'delivery_address is required',
        code: 'MISSING_ADDRESS'
      });
    }

    const delivery = await deliveryService.createDelivery({
      order_id,
      delivery_address,
      estimated_delivery_date
    });

    res.status(201).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    logger.error(`deliveryController.createDelivery error: ${error.message}`);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Delivery already exists for this order',
        code: 'DELIVERY_EXISTS'
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'ORDER_NOT_FOUND'
      });
    }

    next(error);
  }
};

/**
 * Get delivery status for an order
 */
exports.getDeliveryByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId parameter is required',
        code: 'MISSING_ORDER_ID'
      });
    }

    const delivery = await deliveryService.getDeliveryByOrder(orderId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found for this order',
        code: 'DELIVERY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    logger.error(`deliveryController.getDeliveryByOrder error: ${error.message}`);
    next(error);
  }
};

/**
 * Get specific delivery by ID
 */
exports.getDeliveryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Delivery ID is required',
        code: 'MISSING_ID'
      });
    }

    const delivery = await deliveryService.getDeliveryById(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        code: 'DELIVERY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    logger.error(`deliveryController.getDeliveryById error: ${error.message}`);
    next(error);
  }
};

/**
 * Get all deliveries for a delivery agent
 */
exports.getAgentDeliveries = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
        code: 'MISSING_AGENT_ID'
      });
    }

    const result = await deliveryService.getAgentDeliveries(agentId, {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`deliveryController.getAgentDeliveries error: ${error.message}`);
    next(error);
  }
};

/**
 * Update delivery status
 * Can be done by delivery agent or admin
 */
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, location, contact_attempted } = req.body;
    const userId = req.user.id;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Delivery ID is required',
        code: 'MISSING_ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
        code: 'MISSING_STATUS'
      });
    }

    const validStatuses = ['assigned', 'in_transit', 'delivered', 'failed', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    const delivery = await deliveryService.getDeliveryById(id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        code: 'DELIVERY_NOT_FOUND'
      });
    }

    // Check authorization: agent must own delivery or be admin
    if (req.user.roles && !req.user.roles.includes('admin')) {
      if (delivery.assigned_agent_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own deliveries',
          code: 'UNAUTHORIZED'
        });
      }
    }

    const updated = await deliveryService.updateDeliveryStatus(id, {
      status,
      notes,
      location,
      contact_attempted,
      updated_by_id: userId
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error(`deliveryController.updateDeliveryStatus error: ${error.message}`);
    
    if (error.message.includes('invalid status')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS'
      });
    }

    next(error);
  }
};

/**
 * Assign delivery agent to a delivery
 * Admin/Delivery Manager only
 */
exports.assignDeliveryAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agent_id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Delivery ID is required',
        code: 'MISSING_ID'
      });
    }

    if (!agent_id) {
      return res.status(400).json({
        success: false,
        error: 'agent_id is required',
        code: 'MISSING_AGENT_ID'
      });
    }

    const delivery = await deliveryService.assignDeliveryAgent(id, agent_id);

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    logger.error(`deliveryController.assignDeliveryAgent error: ${error.message}`);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'DELIVERY_NOT_FOUND'
      });
    }

    next(error);
  }
};

/**
 * Get all deliveries (admin only)
 */
exports.getAllDeliveries = async (req, res, next) => {
  try {
    const { status, agent_id, limit = 50, offset = 0 } = req.query;

    const result = await deliveryService.getAllDeliveries({
      status,
      agent_id,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`deliveryController.getAllDeliveries error: ${error.message}`);
    next(error);
  }
};

/**
 * Get delivery statistics
 */
exports.getDeliveryStats = async (req, res, next) => {
  try {
    const stats = await deliveryService.getDeliveryStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`deliveryController.getDeliveryStats error: ${error.message}`);
    next(error);
  }
};

/**
 * Get agent performance metrics
 */
exports.getAgentMetrics = async (req, res, next) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'agentId parameter is required',
        code: 'MISSING_AGENT_ID'
      });
    }

    const metrics = await deliveryService.getAgentMetrics(agentId);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error(`deliveryController.getAgentMetrics error: ${error.message}`);
    next(error);
  }
};

/**
 * Health check
 */
exports.health = (req, res) => {
  res.json({
    success: true,
    message: 'Delivery Service is running',
    timestamp: new Date().toISOString()
  });
};
