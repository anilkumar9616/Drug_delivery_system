const db = require('../../../../shared/database');
const logger = require('../../../../shared/logger');

class OrderRepository {
  /**
   * Find order by ID
   */
  async findById(orderId) {
    try {
      const query = `
        SELECT id, user_id, status, total_amount, shipping_address_id,
               payment_status, created_at, updated_at, paid_at, shipped_at, delivered_at, cancelled_at
        FROM orders
        WHERE id = $1
      `;
      
      const result = await db.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`OrderRepository.findById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find orders by user ID
   */
  async findByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT id, user_id, status, total_amount, shipping_address_id,
               payment_status, created_at, updated_at, paid_at, shipped_at, delivered_at
        FROM orders
        WHERE user_id = $1
      `;
      
      const params = [userId];
      let paramCount = 2;

      // Filter by status
      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      return {
        orders: result.rows,
        total
      };
    } catch (error) {
      logger.error(`OrderRepository.findByUserId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all orders (admin)
   */
  async findAll(filters = {}) {
    try {
      let query = `
        SELECT id, user_id, status, total_amount, shipping_address_id,
               payment_status, created_at, updated_at, paid_at, shipped_at, delivered_at
        FROM orders
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 1;

      // Filter by status
      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      return {
        orders: result.rows,
        total
      };
    } catch (error) {
      logger.error(`OrderRepository.findAll error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get order items for an order
   */
  async getOrderItems(orderId) {
    try {
      const query = `
        SELECT id, order_id, medicine_id, quantity, price_at_purchase, created_at
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `;
      
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      logger.error(`OrderRepository.getOrderItems error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update order status with timestamp
   */
  async updateStatus(orderId, status) {
    try {
      const statusTimestampMap = {
        paid: 'paid_at',
        shipped: 'shipped_at',
        delivered: 'delivered_at',
        cancelled: 'cancelled_at',
        refunded: 'refunded_at'
      };

      let updateQuery = `UPDATE orders SET status = $1`;
      const params = [status, orderId];
      let paramCount = 3;

      // Set appropriate timestamp
      if (statusTimestampMap[status]) {
        updateQuery += `, ${statusTimestampMap[status]} = NOW()`;
      }

      updateQuery += `, updated_at = NOW() WHERE id = $2 RETURNING *`;

      const result = await db.query(updateQuery, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`OrderRepository.updateStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM orders
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error(`OrderRepository.getStats error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get orders by date range
   */
  async getOrdersByDateRange(startDate, endDate, filters = {}) {
    try {
      let query = `
        SELECT id, user_id, status, total_amount, created_at
        FROM orders
        WHERE created_at >= $1 AND created_at < $2
      `;
      
      const params = [startDate, endDate];
      let paramCount = 3;

      // Filter by status
      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error(`OrderRepository.getOrdersByDateRange error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending payment orders
   */
  async getPendingPaymentOrders() {
    try {
      const query = `
        SELECT id, user_id, total_amount, created_at
        FROM orders
        WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 minutes'
        ORDER BY created_at ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`OrderRepository.getPendingPaymentOrders error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if idempotency key exists
   */
  async idempotencyKeyExists(idempotencyKey) {
    try {
      const query = `
        SELECT id FROM orders WHERE idempotency_key = $1
      `;
      
      const result = await db.query(query, [idempotencyKey]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`OrderRepository.idempotencyKeyExists error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's total spent
   */
  async getUserTotalSpent(userId) {
    try {
      const query = `
        SELECT SUM(total_amount) as total_spent
        FROM orders
        WHERE user_id = $1 AND status = 'paid'
      `;
      
      const result = await db.query(query, [userId]);
      return parseFloat(result.rows[0].total_spent) || 0;
    } catch (error) {
      logger.error(`OrderRepository.getUserTotalSpent error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get orders for delivery
   */
  async getOrdersForDelivery(filters = {}) {
    try {
      let query = `
        SELECT id, user_id, status, total_amount, shipping_address_id
        FROM orders
        WHERE status = 'paid'
      `;
      
      const params = [];
      let paramCount = 1;

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      query += ` ORDER BY created_at ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error(`OrderRepository.getOrdersForDelivery error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OrderRepository();
