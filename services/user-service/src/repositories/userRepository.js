const db = require('../../../../shared/database');
const logger = require('../../../../shared/logger');

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId) {
    try {
      const query = `
        SELECT id, email, name, role, phone, created_at, updated_at, last_login, is_active
        FROM users
        WHERE id = $1
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`UserRepository.findById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const query = `
        SELECT id, email, name, role, phone, created_at, updated_at, last_login, is_active
        FROM users
        WHERE email = $1
      `;
      
      const result = await db.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`UserRepository.findByEmail error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(userId, updates) {
    try {
      const allowedFields = ['name', 'phone'];
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
        return true;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id
      `;

      const result = await db.query(query, values);
      return !!result.rows[0];
    } catch (error) {
      logger.error(`UserRepository.update error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all addresses for user
   */
  async getAddresses(userId) {
    try {
      const query = `
        SELECT id, user_id, street, city, state, postal_code, country, is_default, created_at, updated_at
        FROM user_addresses
        WHERE user_id = $1
        ORDER BY is_default DESC, created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error(`UserRepository.getAddresses error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single address by ID
   */
  async getAddressById(addressId) {
    try {
      const query = `
        SELECT id, user_id, street, city, state, postal_code, country, is_default, created_at, updated_at
        FROM user_addresses
        WHERE id = $1
      `;
      
      const result = await db.query(query, [addressId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`UserRepository.getAddressById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new address
   */
  async createAddress(userId, addressData) {
    try {
      const query = `
        INSERT INTO user_addresses (user_id, street, city, state, postal_code, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, street, city, state, postal_code, country, is_default, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        userId,
        addressData.street,
        addressData.city,
        addressData.state || null,
        addressData.postal_code,
        addressData.country,
        addressData.is_default || false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`UserRepository.createAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update address
   */
  async updateAddress(addressId, updates) {
    try {
      const allowedFields = ['street', 'city', 'state', 'postal_code', 'country', 'is_default'];
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
        return true;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(addressId);

      const query = `
        UPDATE user_addresses
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id
      `;

      const result = await db.query(query, values);
      return !!result.rows[0];
    } catch (error) {
      logger.error(`UserRepository.updateAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId) {
    try {
      const query = `
        DELETE FROM user_addresses
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await db.query(query, [addressId]);
      return !!result.rows[0];
    } catch (error) {
      logger.error(`UserRepository.deleteAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get default address for user
   */
  async getDefaultAddress(userId) {
    try {
      const query = `
        SELECT id, user_id, street, city, state, postal_code, country, is_default, created_at, updated_at
        FROM user_addresses
        WHERE user_id = $1 AND is_default = true
        LIMIT 1
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`UserRepository.getDefaultAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bulk operations for admin
   */
  async countActiveUsers() {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM users
        WHERE is_active = true
      `;
      
      const result = await db.query(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`UserRepository.countActiveUsers error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get users by role (admin only)
   */
  async getUsersByRole(role, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT id, email, name, role, phone, created_at, updated_at, is_active
        FROM users
        WHERE role = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [role, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error(`UserRepository.getUsersByRole error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserRepository();
