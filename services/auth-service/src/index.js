// Auth Service - Main Application Entry Point

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Import routes
const authRoutes = require('./routes/index');

// Initialize Express app
const app = express();

// ============================================================
// MIDDLEWARE SETUP
// ============================================================

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[AUTH SERVICE] ${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth Service is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use(authRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ============================================================
// SERVER STARTUP
// ============================================================

const PORT = process.env.AUTH_SERVICE_PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║  🔐 Auth Service Started                  ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT}                            ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(18)}║
╠═══════════════════════════════════════════╣
║  Endpoints:                               ║
║  - POST   /register                       ║
║  - POST   /login                          ║
║  - POST   /refresh-token                  ║
║  - POST   /logout                         ║
║  - POST   /verify-token                   ║
║  - GET    /health                         ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  server.close(() => {
    console.log('Auth Service closed');
    process.exit(0);
  });
});

module.exports = app;
