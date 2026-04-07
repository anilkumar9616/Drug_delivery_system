const db = require('../../../../shared/database');
const logger = require('../../../../shared/logger');

class PrescriptionRepository {
  /**
   * Find prescription by ID
   */
  async findById(prescriptionId) {
    try {
      const query = `
        SELECT id, user_id, file_url, status, medicine_id, approval_notes,
               approved_by_id, approval_date, expires_at, created_at, updated_at
        FROM prescriptions
        WHERE id = $1
      `;
      
      const result = await db.query(query, [prescriptionId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`PrescriptionRepository.findById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find prescriptions by user ID
   */
  async findByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT id, user_id, file_url, status, medicine_id,
               approved_by_id, approval_date, created_at, updated_at
        FROM prescriptions
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
        prescriptions: result.rows,
        total
      };
    } catch (error) {
      logger.error(`PrescriptionRepository.findByUserId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find prescriptions by status
   */
  async findByStatus(status, filters = {}) {
    try {
      let query = `
        SELECT id, user_id, file_url, status, medicine_id,
               approved_by_id, approval_date, created_at, updated_at
        FROM prescriptions
        WHERE status = $1
      `;
      
      const params = [status];
      let paramCount = 2;

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      query += ` ORDER BY created_at ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      return {
        prescriptions: result.rows,
        total
      };
    } catch (error) {
      logger.error(`PrescriptionRepository.findByStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find approved prescriptions by user ID
   */
  async findApprovedByUserId(userId) {
    try {
      const query = `
        SELECT id, user_id, medicine_id, status, approval_date, expires_at
        FROM prescriptions
        WHERE user_id = $1 AND status = 'approved'
        ORDER BY approval_date DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error(`PrescriptionRepository.findApprovedByUserId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create prescription
   */
  async create(prescriptionData) {
    try {
      const query = `
        INSERT INTO prescriptions (user_id, file_url, status, medicine_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, file_url, status, medicine_id, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        prescriptionData.user_id,
        prescriptionData.file_url,
        prescriptionData.status,
        prescriptionData.medicine_id || null
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`PrescriptionRepository.create error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update prescription status
   */
  async updateStatus(prescriptionId, status, approverIdId, notes, approvalDate) {
    try {
      const query = `
        UPDATE prescriptions
        SET status = $1,
            approved_by_id = $2,
            approval_notes = $3,
            approval_date = $4,
            expires_at = $4 + INTERVAL '1 year',
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, user_id, file_url, status, medicine_id,
                  approved_by_id, approval_notes, approval_date, expires_at,
                  created_at, updated_at
      `;
      
      const result = await db.query(query, [
        status,
        approverIdId,
        notes,
        approvalDate,
        prescriptionId
      ]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`PrescriptionRepository.updateStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_prescriptions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(DISTINCT user_id) as unique_users
        FROM prescriptions
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error(`PrescriptionRepository.getStats error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get expired prescriptions
   */
  async getExpiredPrescriptions() {
    try {
      const query = `
        SELECT id, user_id, medicine_id, approval_date, expires_at
        FROM prescriptions
        WHERE status = 'approved' AND expires_at < NOW()
        ORDER BY expires_at ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`PrescriptionRepository.getExpiredPrescriptions error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get prescriptions expiring soon (within 30 days)
   */
  async getPrescriptionsExpiringsSoon() {
    try {
      const query = `
        SELECT id, user_id, medicine_id, expires_at
        FROM prescriptions
        WHERE status = 'approved' 
          AND expires_at > NOW() 
          AND expires_at <= NOW() + INTERVAL '30 days'
        ORDER BY expires_at ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`PrescriptionRepository.getPrescriptionsExpiringsSoon error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count prescriptions approved by pharmacist
   */
  async countApprovedByPharmacist(pharmacistId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM prescriptions
        WHERE approved_by_id = $1 AND status = 'approved'
      `;
      
      const result = await db.query(query, [pharmacistId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`PrescriptionRepository.countApprovedByPharmacist error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PrescriptionRepository();
