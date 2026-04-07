// Auth Service - Database Repository
// Handles all database operations for authentication

const { query } = require('../../../../shared/database');

class AuthRepository {
  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(userId) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  // Create new user
  static async createUser(email, hashedPassword, name, role = 'user') {
    const result = await query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role]
    );
    return result.rows[0];
  }

  // Update last login timestamp
  static async updateLastLogin(userId) {
    const result = await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING id, last_login',
      [userId]
    );
    return result.rows[0];
  }

  // Check if email exists
  static async emailExists(email) {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    return result.rows.length > 0;
  }

  // Update password
  static async updatePassword(userId, hashedPassword) {
    const result = await query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, userId]
    );
    return result.rows[0];
  }
}

module.exports = AuthRepository;
