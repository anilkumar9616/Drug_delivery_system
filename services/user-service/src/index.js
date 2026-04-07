const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const logger = require('../../../shared/logger');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5002;

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

/**
 * Routes
 */
app.use('/', routes);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  logger.error(`Unhandled error: ${error.message}`);

  // Database errors
  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      code: 'INVALID_REFERENCE'
    });
  }

  // Generic error
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  });
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  logger.info(`User Service running on port ${PORT}`);
  console.log(`\n✅ User Service started on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
