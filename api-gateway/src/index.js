// API Gateway - Main Application Entry Point
// Brings together all middleware, routing, and error handling

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const {
  requestLogger,
  consoleLogger,
  apiLogger,
  errorLogger,
  Logger,
} = require('./middleware/logger.middleware');
const {
  globalLimiter,
  authenticatedUserLimiter,
  authEndpointLimiter,
  paymentEndpointLimiter,
} = require('./middleware/rateLimiter.middleware');
const {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
} = require('./middleware/error.middleware');

// Import routes
const apiRoutes = require('./routes/index');

// Initialize Express app
const app = express();

// ============================================================
// GLOBAL MIDDLEWARE SETUP
// ============================================================

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// LOGGING MIDDLEWARE
// ============================================================

// File-based access logging (all requests)
app.use(requestLogger);

// Development console logging (optional)
if (process.env.NODE_ENV === 'development') {
  app.use(consoleLogger);
}

// Custom API logger
app.use(apiLogger);

// ============================================================
// RATE LIMITING MIDDLEWARE
// ============================================================

// Global rate limiter (applies to all routes except /health)
app.use(globalLimiter);

// Per-user rate limiter for authenticated users
app.use(authenticatedUserLimiter);

// ============================================================
// REQUEST ID MIDDLEWARE
// ============================================================

// Add unique request ID for tracing
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Request-ID', req.id);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API routes with /api prefix
app.use('/api', apiRoutes);

// ============================================================
// ENDPOINT-SPECIFIC RATE LIMITERS
// ============================================================

// Apply stricter rate limiting to sensitive endpoints
app.post('/api/auth/login', authEndpointLimiter);
app.post('/api/auth/register', authEndpointLimiter);
app.post('/api/orders', paymentEndpointLimiter);

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================

// Validation error handler
app.use(validationErrorHandler);

// Error logger
app.use(errorLogger);

// 404 handler (must be before global error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================

const PORT = process.env.GATEWAY_PORT || 4000;

const server = app.listen(PORT, () => {
  Logger.info('🚀 API Gateway started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  console.log(`
╔════════════════════════════════════════════════╗
║     API Gateway - Drug Delivery Platform       ║
╠════════════════════════════════════════════════╣
║  Status: Running                               ║
║  Port: ${PORT}                            ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}║
╠════════════════════════════════════════════════╣
║  Available Routes:                             ║
║  - POST   /api/auth/register                   ║
║  - POST   /api/auth/login                      ║
║  - POST   /api/auth/logout                     ║
║  - GET    /api/medicines                       ║
║  - GET    /api/orders                          ║
║  - POST   /api/orders                          ║
║  - GET    /api/prescriptions                   ║
║  - POST   /api/prescriptions/upload            ║
║  - GET    /api/users/profile                   ║
║  - GET    /health (no auth required)           ║
╠════════════════════════════════════════════════╣
║  Documentation: ./docs/ARCHITECTURE.md         ║
╚════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    Logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    Logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', {
    promise: promise.toString(),
    reason: reason.toString(),
  });
  process.exit(1);
});

module.exports = app;
