const deliveryRepository = require('../repositories/deliveryRepository');
const logger = require('../../../../shared/logger');

class DeliveryService {
  /**
   * Create delivery record for an order
   */
  async createDelivery(deliveryData) {
    try {
      logger.info(`Creating delivery for order ${deliveryData.order_id}`);

      // Validate order exists (in production, call Order Service)
      // For now, we trust Order Service has validated

      // Check if delivery already exists
      const existing = await deliveryRepository.findByOrderId(deliveryData.order_id);
      if (existing) {
        throw new Error('Delivery already exists for this order');
      }

      // Create delivery with default status 'pending' and unassigned
      const delivery = await deliveryRepository.create({
        order_id: deliveryData.order_id,
        delivery_address: deliveryData.delivery_address,
        estimated_delivery_date: deliveryData.estimated_delivery_date,
        status: 'pending',
        assigned_agent_id: null
      });

      logger.info(`Delivery created with ID ${delivery.id} for order ${delivery.order_id}`);
      return delivery;
    } catch (error) {
      logger.error(`DeliveryService.createDelivery error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get delivery by order ID
   */
  async getDeliveryByOrder(orderId) {
    try {
      const delivery = await deliveryRepository.findByOrderId(orderId);
      return delivery;
    } catch (error) {
      logger.error(`DeliveryService.getDeliveryByOrder error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get delivery by ID
   */
  async getDeliveryById(deliveryId) {
    try {
      const delivery = await deliveryRepository.findById(deliveryId);
      return delivery;
    } catch (error) {
      logger.error(`DeliveryService.getDeliveryById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all deliveries for a delivery agent
   */
  async getAgentDeliveries(agentId, filters = {}) {
    try {
      logger.info(`Fetching deliveries for agent ${agentId}`);

      const result = await deliveryRepository.findByAgentId(agentId, filters);
      return result;
    } catch (error) {
      logger.error(`DeliveryService.getAgentDeliveries error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update delivery status
   * Validates status transitions
   */
  async updateDeliveryStatus(deliveryId, updateData) {
    try {
      const delivery = await deliveryRepository.findById(deliveryId);
      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const validTransitions = {
        'pending': ['assigned', 'cancelled'],
        'assigned': ['in_transit', 'failed', 'cancelled'],
        'in_transit': ['delivered', 'failed'],
        'delivered': ['returned'],
        'failed': ['assigned', 'cancelled'],
        'returned': []
      };

      const newStatus = updateData.status;
      const currentStatus = delivery.status;

      // Check if transition is valid
      if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      logger.info(`Updating delivery ${deliveryId} status from ${currentStatus} to ${newStatus}`);

      // Update delivery
      const updated = await deliveryRepository.updateStatus(deliveryId, {
        status: newStatus,
        notes: updateData.notes,
        location: updateData.location,
        contact_attempted: updateData.contact_attempted,
        updated_by_id: updateData.updated_by_id,
        delivered_at: newStatus === 'delivered' ? new Date() : null
      });

      logger.info(`Delivery ${deliveryId} status updated to ${newStatus}`);

      return updated;
    } catch (error) {
      logger.error(`DeliveryService.updateDeliveryStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign delivery agent to a delivery
   */
  async assignDeliveryAgent(deliveryId, agentId) {
    try {
      const delivery = await deliveryRepository.findById(deliveryId);
      if (!delivery) {
        throw new Error('Delivery not found');
      }

      logger.info(`Assigning agent ${agentId} to delivery ${deliveryId}`);

      // Update delivery with agent assignment and change status to 'assigned'
      const updated = await deliveryRepository.assignAgent(deliveryId, agentId);

      logger.info(`Agent ${agentId} assigned to delivery ${deliveryId}`);

      return updated;
    } catch (error) {
      logger.error(`DeliveryService.assignDeliveryAgent error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all deliveries with filters (admin)
   */
  async getAllDeliveries(filters = {}) {
    try {
      logger.info(`Fetching all deliveries with filters: ${JSON.stringify(filters)}`);

      const result = await deliveryRepository.findAll(filters);
      return result;
    } catch (error) {
      logger.error(`DeliveryService.getAllDeliveries error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats() {
    try {
      logger.info('Fetching delivery statistics');

      const stats = await deliveryRepository.getStats();
      return stats;
    } catch (error) {
      logger.error(`DeliveryService.getDeliveryStats error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId) {
    try {
      logger.info(`Fetching metrics for agent ${agentId}`);

      const metrics = await deliveryRepository.getAgentMetrics(agentId);
      return metrics;
    } catch (error) {
      logger.error(`DeliveryService.getAgentMetrics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get deliveries expiring soon (not delivered within SLA)
   */
  async getDelayedDeliveries() {
    try {
      const delayed = await deliveryRepository.findDelayed();
      return delayed;
    } catch (error) {
      logger.error(`DeliveryService.getDelayedDeliveries error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new DeliveryService();
