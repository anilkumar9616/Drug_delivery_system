const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('../../../shared/logger');
const db = require('../../../shared/database');

dotenv.config();

const app = express();
const PORT = process.env.PRESCRIPTION_SERVICE_PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at ${uploadsDir}`);
}

// Routes
const prescriptionRoutes = require('./routes');
app.use('/prescriptions', prescriptionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Prescription Service is running',
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

  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 5MB limit',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'UPLOAD_ERROR'
    });
  }

  // Generic error
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
      logger.info(`Prescription Service running on port ${PORT}`);
      console.log(`\n📋 Prescription Service`);
      console.log(`   Running on: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`\n✨ Service initialized\n`);
    });
  } catch (error) {
    logger.error(`Failed to start Prescription Service: ${error.message}`);
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
