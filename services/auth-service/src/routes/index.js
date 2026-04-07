// Auth Service - Routes
// Defines all authentication endpoints

const express = require('express');
const AuthController = require('../controllers/authController');
const { validateRegister, validateLogin, validateRefreshToken } = require('../middleware/validation');

const router = express.Router();

// POST /register - Register new user
router.post('/register', validateRegister, AuthController.register);

// POST /login - Login user
router.post('/login', validateLogin, AuthController.login);

// POST /refresh-token - Refresh access token
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);

// POST /logout - Logout user (token blacklisted by API Gateway)
router.post('/logout', AuthController.logout);

// POST /verify-token - Verify JWT token (for internal use)
router.post('/verify-token', AuthController.verifyToken);

module.exports = router;
