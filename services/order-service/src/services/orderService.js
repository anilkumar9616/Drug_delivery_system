const orderRepository = require('../repositories/orderRepository');
const axios = require('axios');
const logger = require('../../../../shared/logger');
const db = require('../../../../shared/database');

// Service URLs
const MEDICINE_SERVICE_URL = process.env.MEDICINE_SERVICE_URL || 'http://localhost:5003';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';

class OrderService {
  /**
   * Create new order with stock validation and transactions
   */
  async createOrder(orderData) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if idempotency_key already exists (prevent duplicates)
      const existingQuery = `
        SELECT id FROM orders WHERE idempotency_key = $1
      `;
      const existing = await client.query(existingQuery, [orderData.idempotencyKey]);
      
      if (existing.rows.length > 0) {
        throw new Error('Duplicate order with this idempotency_key already exists');
      }

      // Fetch medicines and validate prescription requirements
      const prescriptionCheck = await this._validatePrescriptions(
        orderData.userId,
        orderData.items
      );

      if (!prescriptionCheck.valid) {
        throw new Error(`Prescription required for: ${prescriptionCheck.medicines.join(', ')}`);
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of orderData.items) {
        const medicine = await this._getMedicine(item.medicine_id);
        if (!medicine) {
          throw new Error(`Medicine ${item.medicine_id} not found`);
        }
        totalAmount += medicine.price * item.quantity;
      }

      // Create order
      const orderQuery = `
        INSERT INTO orders (user_id, status, total_amount, shipping_address_id, idempotency_key)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, status, total_amount, shipping_address_id, created_at, updated_at
      `;

      const orderResult = await client.query(orderQuery, [
        orderData.userId,
        'pending',
        totalAmount,
        orderData.shippingAddressId,
        orderData.idempotencyKey
      ]);

      const order = orderResult.rows[0];

      // Add order items
      for (const item of orderData.items) {
        const medicine = await this._getMedicine(item.medicine_id);

        // Verify stock availability (lock the row)
        const stockCheck = await client.query(
          'SELECT quantity_in_stock FROM medicines WHERE id = $1 FOR UPDATE',
          [item.medicine_id]
        );

        if (!stockCheck.rows[0] || stockCheck.rows[0].quantity_in_stock < item.quantity) {
          throw new Error(`Insufficient stock for medicine ${item.medicine_id}`);
        }

        // Insert order item
        const itemQuery = `
          INSERT INTO order_items (order_id, medicine_id, quantity, price_at_purchase)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;

        await client.query(itemQuery, [
          order.id,
          item.medicine_id,
          item.quantity,
          medicine.price
        ]);
      }

      await client.query('COMMIT');

      logger.info(`Order created: ${order.id} for user ${orderData.userId}`);

      return {
        id: order.id,
        user_id: order.user_id,
        status: order.status,
        total_amount: order.total_amount,
        shipping_address_id: order.shipping_address_id,
        items: orderData.items,
        created_at: order.created_at,
        updated_at: order.updated_at,
        payment_status: 'pending'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`OrderService.createOrder error: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId, filters = {}) {
    try {
      return await orderRepository.findByUserId(userId, filters);
    } catch (error) {
      logger.error(`OrderService.getUserOrders error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single order with items
   */
  async getOrder(orderId) {
    try {
      const order = await orderRepository.findById(orderId);
      
      if (!order) {
        return null;
      }

      // Get order items
      const items = await orderRepository.getOrderItems(orderId);

      return {
        ...order,
        items
      };
    } catch (error) {
      logger.error(`OrderService.getOrder error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process payment for order
   */
  async processPayment(paymentData) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get order
      const orderQuery = `
        SELECT * FROM orders WHERE id = $1 FOR UPDATE
      `;
      const orderResult = await client.query(orderQuery, [paymentData.orderId]);

      if (!orderResult.rows[0]) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Verify user owns this order
      if (order.user_id !== paymentData.userId) {
        throw new Error('Unauthorized to pay this order');
      }

      // Check if already paid
      if (order.status !== 'pending') {
        throw new Error(`Cannot pay order with status: ${order.status}. Already paid?`);
      }

      // Simulate payment processing
      // In real app, call external payment gateway (Stripe, PayPal, etc.)
      const paymentSuccess = await this._processPaymentGateway(
        order.total_amount,
        paymentData.paymentMethod,
        paymentData.transactionId
      );

      if (!paymentSuccess) {
        throw new Error('Payment failed. Please check your payment details and try again.');
      }

      // Update stock for all order items
      const itemsQuery = `
        SELECT medicine_id, quantity FROM order_items WHERE order_id = $1
      `;
      const itemsResult = await client.query(itemsQuery, [paymentData.orderId]);

      for (const item of itemsResult.rows) {
        const updateStockQuery = `
          UPDATE medicines
          SET quantity_in_stock = quantity_in_stock - $1,
              updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(updateStockQuery, [item.quantity, item.medicine_id]);
      }

      // Update order status
      const updateOrderQuery = `
        UPDATE orders
        SET status = $1, paid_at = NOW(), updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const updatedOrderResult = await client.query(updateOrderQuery, ['paid', paymentData.orderId]);

      // Record payment
      const paymentQuery = `
        INSERT INTO payments (order_id, amount, payment_status, transaction_id)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(paymentQuery, [
        paymentData.orderId,
        order.total_amount,
        'completed',
        paymentData.transactionId || 'manual'
      ]);

      await client.query('COMMIT');

      logger.info(`Payment processed for order ${paymentData.orderId}`);

      const updatedOrder = updatedOrderResult.rows[0];
      return {
        id: updatedOrder.id,
        user_id: updatedOrder.user_id,
        status: updatedOrder.status,
        total_amount: updatedOrder.total_amount,
        payment_status: 'completed',
        paid_at: updatedOrder.paid_at,
        created_at: updatedOrder.created_at,
        updated_at: updatedOrder.updated_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`OrderService.processPayment error: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel order (only if not yet paid)
   */
  async cancelOrder(orderId, userId) {
    try {
      const order = await orderRepository.findById(orderId);

      if (!order) {
        return null;
      }

      // Verify user owns this order
      if (order.user_id !== userId) {
        throw new Error('Unauthorized to cancel this order');
      }

      // Only pending orders can be cancelled
      if (order.status !== 'pending') {
        throw new Error(`Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`);
      }

      // Update order status
      const updated = await orderRepository.updateStatus(orderId, 'cancelled');

      logger.info(`Order cancelled: ${orderId}`);

      return updated;
    } catch (error) {
      logger.error(`OrderService.cancelOrder error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund order (admin only)
   */
  async refundOrder(orderId, reason) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get order
      const orderQuery = `
        SELECT * FROM orders WHERE id = $1 FOR UPDATE
      `;
      const orderResult = await client.query(orderQuery, [orderId]);

      if (!orderResult.rows[0]) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Only paid orders can be refunded
      if (order.status !== 'paid' && order.status !== 'shipped' && order.status !== 'delivered') {
        throw new Error(`Cannot refund order with status: ${order.status}`);
      }

      // Restore stock
      const itemsQuery = `
        SELECT medicine_id, quantity FROM order_items WHERE order_id = $1
      `;
      const itemsResult = await client.query(itemsQuery, [orderId]);

      for (const item of itemsResult.rows) {
        const restoreQuery = `
          UPDATE medicines
          SET quantity_in_stock = quantity_in_stock + $1,
              updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(restoreQuery, [item.quantity, item.medicine_id]);
      }

      // Update order status
      const updateQuery = `
        UPDATE orders
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const refundedResult = await client.query(updateQuery, ['refunded', orderId]);

      // Record refund
      const refundQuery = `
        INSERT INTO payments (order_id, amount, payment_status, transaction_id)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(refundQuery, [
        orderId,
        -order.total_amount,
        'refunded',
        `REFUND-${orderId}`
      ]);

      await client.query('COMMIT');

      logger.info(`Order refunded: ${orderId}. Reason: ${reason}`);

      return refundedResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`OrderService.refundOrder error: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    try {
      return await orderRepository.updateStatus(orderId, status);
    } catch (error) {
      logger.error(`OrderService.updateOrderStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all orders (admin)
   */
  async getAllOrders(filters = {}) {
    try {
      return await orderRepository.findAll(filters);
    } catch (error) {
      logger.error(`OrderService.getAllOrders error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Get medicine details from Medicine Service
   */
  async _getMedicine(medicineId) {
    try {
      const response = await axios.get(
        `${MEDICINE_SERVICE_URL}/${medicineId}`,
        { timeout: 5000 }
      );

      if (response.status === 200 && response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to fetch medicine ${medicineId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper: Validate prescriptions
   */
  async _validatePrescriptions(userId, items) {
    try {
      // Get medicines requiring prescription
      const prescriptionMedicines = [];

      for (const item of items) {
        const medicine = await this._getMedicine(item.medicine_id);
        if (medicine && medicine.requires_prescription) {
          prescriptionMedicines.push(medicine.id);
        }
      }

      // If no prescription-required medicines, valid
      if (prescriptionMedicines.length === 0) {
        return { valid: true, medicines: [] };
      }

      // Check user has approved prescriptions for these medicines
      // TODO: Call Prescription Service to validate
      // For now, return valid (prescription validation in full implementation)

      return { valid: true, medicines: [] };
    } catch (error) {
      logger.error(`_validatePrescriptions error: ${error.message}`);
      return { valid: false, medicines: [] };
    }
  }

  /**
   * Helper: Process payment (simulated)
   */
  async _processPaymentGateway(amount, paymentMethod, transactionId) {
    try {
      // Simulate payment processing
      // In production, integrate with real payment gateway
      
      if (!amount || amount <= 0) {
        return false;
      }

      // Simulate success (90% success rate)
      const success = Math.random() < 0.9;

      if (success) {
        logger.info(`Payment processed: ${amount} via ${paymentMethod}`);
      } else {
        logger.warn(`Payment failed: ${amount} via ${paymentMethod}`);
      }

      return success;
    } catch (error) {
      logger.error(`_processPaymentGateway error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get order statistics (for admin dashboard)
   */
  async getOrderStats() {
    try {
      return await orderRepository.getStats();
    } catch (error) {
      logger.error(`OrderService.getOrderStats error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OrderService();
