const db = require('../../../../shared/database');
const logger = require('../../../../shared/logger');

class DeliveryRepository {
  /**
   * Find delivery by ID
   */
  async findById(deliveryId) {
    try {
      const query = `
        SELECT id, order_id, delivery_address, status, assigned_agent_id,
               notes, location, contact_attempted, delivered_at,
               estimated_delivery_date, created_at, updated_at
        FROM deliveries
        WHERE id = $1
      `;
      
      const result = await db.query(query, [deliveryId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`DeliveryRepository.findById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find delivery by order ID
   */
  async findByOrderId(orderId) {
    try {
      const query = `
        SELECT id, order_id, delivery_address, status, assigned_agent_id,
               notes, location, contact_attempted, delivered_at,
               estimated_delivery_date, created_at, updated_at
        FROM deliveries
        WHERE order_id = $1
      `;
      
      const result = await db.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`DeliveryRepository.findByOrderId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find deliveries by agent ID
   */
  async findByAgentId(agentId, filters = {}) {
    try {
      let query = `
        SELECT id, order_id, delivery_address, status, assigned_agent_id,
               notes, location, contact_attempted, delivered_at,
               estimated_delivery_date, created_at, updated_at
        FROM deliveries
        WHERE assigned_agent_id = $1
      `;
      
      const params = [agentId];
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
        deliveries: result.rows,
        total
      };
    } catch (error) {
      logger.error(`DeliveryRepository.findByAgentId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all deliveries with filters
   */
  async findAll(filters = {}) {
    try {
      let query = `
        SELECT id, order_id, delivery_address, status, assigned_agent_id,
               notes, location, contact_attempted, delivered_at,
               estimated_delivery_date, created_at, updated_at
        FROM deliveries
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

      // Filter by agent
      if (filters.agent_id) {
        query += ` AND assigned_agent_id = $${paramCount}`;
        params.push(filters.agent_id);
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
        deliveries: result.rows,
        total
      };
    } catch (error) {
      logger.error(`DeliveryRepository.findAll error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create delivery
   */
  async create(deliveryData) {
    try {
      const query = `
        INSERT INTO deliveries (
          order_id, delivery_address, estimated_delivery_date,
          status, assigned_agent_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, order_id, delivery_address, status, assigned_agent_id,
                  estimated_delivery_date, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        deliveryData.order_id,
        deliveryData.delivery_address,
        deliveryData.estimated_delivery_date,
        deliveryData.status || 'pending',
        deliveryData.assigned_agent_id || null
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`DeliveryRepository.create error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update delivery status
   */
  async updateStatus(deliveryId, statusData) {
    try {
      const query = `
        UPDATE deliveries
        SET status = $1,
            notes = COALESCE($2, notes),
            location = COALESCE($3, location),
            contact_attempted = COALESCE($4, contact_attempted),
            delivered_at = COALESCE($5, delivered_at),
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, order_id, delivery_address, status, assigned_agent_id,
                  notes, location, contact_attempted, delivered_at,
                  estimated_delivery_date, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        statusData.status,
        statusData.notes,
        statusData.location,
        statusData.contact_attempted,
        statusData.delivered_at,
        deliveryId
      ]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`DeliveryRepository.updateStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign agent to delivery
   */
  async assignAgent(deliveryId, agentId) {
    try {
      const query = `
        UPDATE deliveries
        SET assigned_agent_id = $1,
            status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, order_id, delivery_address, status, assigned_agent_id,
                  notes, location, contact_attempted, delivered_at,
                  estimated_delivery_date, created_at, updated_at
      `;
      
      const result = await db.query(query, [agentId, deliveryId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`DeliveryRepository.assignAgent error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  async getStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_deliveries,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned,
          COUNT(DISTINCT assigned_agent_id) as active_agents,
          ROUND(AVG(
            CASE WHEN delivered_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (delivered_at - created_at)) / 3600 
              ELSE NULL 
            END
          ), 2) as avg_delivery_hours
        FROM deliveries
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error(`DeliveryRepository.getStats error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId) {
    try {
      const query = `
        SELECT
          assigned_agent_id as agent_id,
          COUNT(*) as total_deliveries,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_deliveries,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_deliveries,
          SUM(CASE WHEN contact_attempted = true THEN 1 ELSE 0 END) as contact_attempts,
          ROUND(
            (COUNT(CASE WHEN status = 'delivered' THEN 1 END)::numeric / 
             COUNT(*) * 100), 2
          ) as completion_rate,
          MIN(created_at) as first_delivery_date,
          MAX(delivered_at) as last_delivery_date
        FROM deliveries
        WHERE assigned_agent_id = $1
        GROUP BY assigned_agent_id
      `;
      
      const result = await db.query(query, [agentId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`DeliveryRepository.getAgentMetrics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find deliveries past estimated delivery date
   */
  async findDelayed() {
    try {
      const query = `
        SELECT id, order_id, delivery_address, assigned_agent_id,
               estimated_delivery_date, created_at
        FROM deliveries
        WHERE status NOT IN ('delivered', 'cancelled', 'returned')
          AND estimated_delivery_date < NOW()
        ORDER BY estimated_delivery_date ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`DeliveryRepository.findDelayed error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get deliveries without agent assignment
   */
  async findUnassigned() {
    try {
      const query = `
        SELECT id, order_id, delivery_address, status,
               estimated_delivery_date, created_at
        FROM deliveries
        WHERE assigned_agent_id IS NULL
        ORDER BY created_at ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`DeliveryRepository.findUnassigned error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new DeliveryRepository();
