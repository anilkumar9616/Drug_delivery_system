// API Gateway - Error Handling Middleware
// Standardizes error responses across the entire API

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Standardized error response
  const errorResponse = {
    success: false,
    error: message,
    code: code,
  };

  // Add details if available (for development)
  if (process.env.NODE_ENV === 'development' && err.details) {
    errorResponse.details = err.details;
  }

  // Add request ID for tracing
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware to catch 404 errors
const notFoundHandler = (req, res) => {
  const errorResponse = {
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  };

  res.status(404).json(errorResponse);
};

// Middleware for handling async errors in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
const validationErrorHandler = (err, req, res, next) => {
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.map((e) => ({
        field: e.param,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next(err);
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
};
