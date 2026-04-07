// Auth Service - Controller
// Handles HTTP requests for authentication

const AuthService = require('../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
  // POST /register
  static async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password, name } = req.body;

      // Register user
      const user = await AuthService.register(email, password, name);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific errors
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: 'USER_ALREADY_EXISTS',
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Registration failed',
        code: 'REGISTRATION_ERROR',
      });
    }
  }

  // POST /login
  static async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Authenticate user
      const result = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      console.error('Login error:', error);

      // Generic error - don't reveal if email exists or not
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }
  }

  // POST /refresh-token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      // Refresh access token
      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      console.error('Token refresh error:', error);

      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  // POST /logout (for API Gateway to blacklist token)
  static async logout(req, res) {
    try {
      // Token is blacklisted by API Gateway
      // This endpoint confirms logout to the user

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);

      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  // POST /verify-token (for internal service verification)
  static async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
        });
      }

      const decoded = AuthService.verifyToken(token);

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: decoded,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Token verification failed',
        code: 'INVALID_TOKEN',
      });
    }
  }
}

module.exports = AuthController;
