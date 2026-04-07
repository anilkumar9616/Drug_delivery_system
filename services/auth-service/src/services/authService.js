// Auth Service - Business Logic
// Handles authentication logic, token generation, password hashing

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthRepository = require('../repositories/authRepository');

class AuthService {
  // Generate JWT access token
  static generateAccessToken(user) {
    const payload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: process.env.JWT_EXPIRY || '15m',
    });

    return token;
  }

  // Generate refresh token (longer lived)
  static generateRefreshToken(user) {
    const payload = {
      user_id: user.id,
      email: user.email,
      type: 'refresh',
    };

    const token = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
      }
    );

    return token;
  }

  // Hash password using bcrypt
  static async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password with hash
  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  static async register(email, password, name) {
    // Check if user already exists
    const existingUser = await AuthRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await AuthRepository.createUser(email, hashedPassword, name);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  // Login user and generate tokens
  static async login(email, password) {
    // Find user by email
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await AuthRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // Verify refresh token and generate new access token
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret'
      );

      // Fetch fresh user data
      const user = await AuthRepository.findById(decoded.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      return {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      throw new Error(`Refresh token invalid: ${error.message}`);
    }
  }

  // Verify JWT token (used by API Gateway)
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

module.exports = AuthService;
