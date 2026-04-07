const db = require('../../../../shared/database');
const logger = require('../../../../shared/logger');

class MedicineRepository {
  /**
   * Find all medicines
   */
  async findAll() {
    try {
      const query = `
        SELECT id, name, description, price, quantity_in_stock, requires_prescription,
               manufacturer, batch_number, expiry_date, created_at, updated_at
        FROM medicines
        WHERE expiry_date > NOW() OR expiry_date IS NULL
        ORDER BY name ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`MedicineRepository.findAll error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find medicine by ID
   */
  async findById(medicineId) {
    try {
      const query = `
        SELECT id, name, description, price, quantity_in_stock, requires_prescription,
               manufacturer, batch_number, expiry_date, created_at, updated_at
        FROM medicines
        WHERE id = $1 AND (expiry_date > NOW() OR expiry_date IS NULL)
      `;
      
      const result = await db.query(query, [medicineId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`MedicineRepository.findById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search medicines with filters
   */
  async search(filters) {
    try {
      let query = `
        SELECT id, name, description, price, quantity_in_stock, requires_prescription,
               manufacturer, batch_number, expiry_date, created_at, updated_at
        FROM medicines
        WHERE (expiry_date > NOW() OR expiry_date IS NULL)
      `;
      
      const params = [];
      let paramCount = 1;

      // Filter by name (ILIKE for case-insensitive)
      if (filters.name) {
        query += ` AND name ILIKE $${paramCount}`;
        params.push(`%${filters.name}%`);
        paramCount++;
      }

      // Filter by prescription requirement
      if (filters.requires_prescription !== undefined) {
        query += ` AND requires_prescription = $${paramCount}`;
        params.push(filters.requires_prescription);
        paramCount++;
      }

      // Filter by stock availability
      if (filters.inStock) {
        query += ` AND quantity_in_stock > 0`;
      }

      // Filter by price range
      if (filters.minPrice !== undefined) {
        query += ` AND price >= $${paramCount}`;
        params.push(filters.minPrice);
        paramCount++;
      }

      if (filters.maxPrice !== undefined) {
        query += ` AND price <= $${paramCount}`;
        params.push(filters.maxPrice);
        paramCount++;
      }

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      query += ` ORDER BY name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      return {
        medicines: result.rows,
        total
      };
    } catch (error) {
      logger.error(`MedicineRepository.search error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find medicines requiring prescription
   */
  async findByPrescriptionRequired(required = true) {
    try {
      const query = `
        SELECT id, name, description, price, quantity_in_stock, requires_prescription,
               manufacturer, batch_number, expiry_date, created_at, updated_at
        FROM medicines
        WHERE requires_prescription = $1 AND (expiry_date > NOW() OR expiry_date IS NULL)
        ORDER BY name ASC
      `;
      
      const result = await db.query(query, [required]);
      return result.rows;
    } catch (error) {
      logger.error(`MedicineRepository.findByPrescriptionRequired error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new medicine
   */
  async create(medicineData) {
    try {
      const query = `
        INSERT INTO medicines (name, description, price, quantity_in_stock, requires_prescription,
                              manufacturer, batch_number, expiry_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, description, price, quantity_in_stock, requires_prescription,
                  manufacturer, batch_number, expiry_date, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        medicineData.name,
        medicineData.description || null,
        medicineData.price,
        medicineData.quantity_in_stock,
        medicineData.requires_prescription || false,
        medicineData.manufacturer || null,
        medicineData.batch_number || null,
        medicineData.expiry_date || null
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`MedicineRepository.create error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update medicine
   */
  async update(medicineId, updates) {
    try {
      const allowedFields = ['name', 'description', 'price', 'quantity_in_stock', 
                            'requires_prescription', 'manufacturer', 'batch_number', 'expiry_date'];
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          values.push(updates[field]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return this.findById(medicineId);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(medicineId);

      const query = `
        UPDATE medicines
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, description, price, quantity_in_stock, requires_prescription,
                  manufacturer, batch_number, expiry_date, created_at, updated_at
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`MedicineRepository.update error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete medicine
   */
  async delete(medicineId) {
    try {
      const query = `
        DELETE FROM medicines
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await db.query(query, [medicineId]);
      return !!result.rows[0];
    } catch (error) {
      logger.error(`MedicineRepository.delete error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update stock (decrement after successful order)
   */
  async updateStock(medicineId, quantityChange) {
    try {
      const query = `
        UPDATE medicines
        SET quantity_in_stock = quantity_in_stock + $1,
            updated_at = NOW()
        WHERE id = $2 AND (quantity_in_stock + $1) >= 0
        RETURNING id, quantity_in_stock
      `;
      
      const result = await db.query(query, [quantityChange, medicineId]);
      
      if (result.rows.length === 0) {
        throw new Error('Insufficient stock or medicine not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`MedicineRepository.updateStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reserve stock for an order (using stock_reservations table)
   */
  async reserveStock(orderId, items, durationMinutes = 15) {
    try {
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        const reservations = [];
        
        for (const item of items) {
          // Lock the medicine row for update
          const lockQuery = `
            SELECT id, quantity_in_stock
            FROM medicines
            WHERE id = $1
            FOR UPDATE
          `;
          
          const lockResult = await client.query(lockQuery, [item.medicine_id]);
          
          if (!lockResult.rows[0] || lockResult.rows[0].quantity_in_stock < item.quantity) {
            throw new Error(`Insufficient stock for medicine ${item.medicine_id}`);
          }

          // Insert reservation
          const reserveQuery = `
            INSERT INTO stock_reservations (medicine_id, quantity_reserved, reservation_expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '${durationMinutes} minutes')
            RETURNING id, medicine_id, quantity_reserved, reservation_expires_at
          `;
          
          const reserveResult = await client.query(reserveQuery, [item.medicine_id, item.quantity]);
          reservations.push(reserveResult.rows[0]);
        }

        await client.query('COMMIT');
        return reservations;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`MedicineRepository.reserveStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Release reserved stock (on order cancellation)
   */
  async releaseStock(orderId) {
    try {
      const query = `
        DELETE FROM stock_reservations
        WHERE id IN (
          SELECT sr.id FROM stock_reservations sr
          WHERE sr.medicine_id IN (
            SELECT medicine_id FROM stock_reservations
            WHERE id IN (SELECT id FROM stock_reservations WHERE medicine_id != 0)
          )
        )
        RETURNING medicine_id, quantity_reserved
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`MedicineRepository.releaseStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get expired medicines
   */
  async getExpiredMedicines() {
    try {
      const query = `
        SELECT id, name, expiry_date
        FROM medicines
        WHERE expiry_date <= NOW()
        ORDER BY expiry_date ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`MedicineRepository.getExpiredMedicines error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get medicines expiring soon (within 30 days)
   */
  async getMedicinesExpiringsSoon() {
    try {
      const query = `
        SELECT id, name, expiry_date
        FROM medicines
        WHERE expiry_date > NOW() AND expiry_date <= NOW() + INTERVAL '30 days'
        ORDER BY expiry_date ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`MedicineRepository.getMedicinesExpiringsSoon error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get low stock medicines
   */
  async getLowStockMedicines(threshold = 10) {
    try {
      const query = `
        SELECT id, name, quantity_in_stock
        FROM medicines
        WHERE quantity_in_stock <= $1
        ORDER BY quantity_in_stock ASC
      `;
      
      const result = await db.query(query, [threshold]);
      return result.rows;
    } catch (error) {
      logger.error(`MedicineRepository.getLowStockMedicines error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MedicineRepository();
