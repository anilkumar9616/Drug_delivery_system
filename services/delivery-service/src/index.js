const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('../../../shared/logger');
const db = require('../../../shared/database');

dotenv.config();

const app = express();
const PORT = process.env.DELIVERY_SERVICE_PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
const deliveryRoutes = require('./routes');
app.use('/deliveries', deliveryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery Service is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    const result = await db.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Delivery Service running on port ${PORT}`);
      console.log(`\n🚚 Delivery Service`);
      console.log(`   Running on: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`\n✨ Service initialized\n`);
    });
  } catch (error) {
    logger.error(`Failed to start Delivery Service: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  db.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  db.end();
  process.exit(0);
});

startServer();

module.exports = app;
