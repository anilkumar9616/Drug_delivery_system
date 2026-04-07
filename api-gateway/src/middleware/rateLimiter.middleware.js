// API Gateway - Rate Limiting Middleware
// Prevents abuse by limiting requests per user/endpoint

const rateLimit = require('express-rate-limit');

// Global rate limiter (applies to all routes)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  },
});

// Per-user rate limiter (authenticated users only)
// Allows slightly higher limits for authenticated users
const authenticatedUserLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Max 200 requests per minute per authenticated user
  keyGenerator: (req) => {
    // Use user ID as key for authenticated users
    return req.user ? req.user.id : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Maximum 200 requests per minute.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  skip: (req) => {
    return req.path === '/health';
  },
});

// Endpoint-specific rate limiters
// Stricter limits for sensitive endpoints (auth, payment)
const authEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  keyGenerator: (req) => {
    // Rate limit by email or IP
    return req.body.email || req.ip;
  },
  skip: (req) => {
    return req.path === '/health';
  },
});

// Payment/Order endpoints - Stricter limits
const paymentEndpointLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 payment requests per 5 minutes
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many payment requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

module.exports = {
  globalLimiter,
  authenticatedUserLimiter,
  authEndpointLimiter,
  paymentEndpointLimiter,
};
