// API Gateway - Service Client
// Handles HTTP calls to microservices with timeout and retry logic

const axios = require('axios');
const { Logger } = require('../middleware/logger.middleware');

// Service URLs configuration
const SERVICES = {
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  MEDICINE_SERVICE: process.env.MEDICINE_SERVICE_URL || 'http://localhost:5003',
  PRESCRIPTION_SERVICE: process.env.PRESCRIPTION_SERVICE_URL || 'http://localhost:5004',
  ORDER_SERVICE: process.env.ORDER_SERVICE_URL || 'http://localhost:5005',
  DELIVERY_SERVICE: process.env.DELIVERY_SERVICE_URL || 'http://localhost:5006',
};

// Axios instance with timeout and retry configuration
const createServiceClient = (timeout = 5000) => {
  return axios.create({
    timeout: timeout,
    validateStatus: () => true, // Don't throw on any status code
  });
};

const serviceClient = createServiceClient();

// Circuit breaker state management
const circuitBreakerState = {};

// Helper to reset circuit breaker
const resetCircuitBreaker = (serviceName) => {
  circuitBreakerState[serviceName] = {
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    failureCount: 0,
    lastFailureTime: null,
    resetTimeout: 30000, // 30 seconds
  };
};

// Initialize circuit breakers for all services
Object.keys(SERVICES).forEach((service) => {
  resetCircuitBreaker(service);
});

// Helper to check circuit breaker state
const checkCircuitBreaker = (serviceName) => {
  const breaker = circuitBreakerState[serviceName] || {
    state: 'CLOSED',
  };

  if (breaker.state === 'OPEN') {
    const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
    if (timeSinceLastFailure > breaker.resetTimeout) {
      breaker.state = 'HALF_OPEN';
      Logger.info('Circuit breaker transitioning to HALF_OPEN', {
        service: serviceName,
      });
    } else {
      throw new Error(
        `Service ${serviceName} is temporarily unavailable (circuit breaker OPEN)`
      );
    }
  }

  return breaker;
};

// Helper to update circuit breaker on failure
const recordFailure = (serviceName) => {
  const breaker = circuitBreakerState[serviceName] || { failureCount: 0 };
  breaker.failureCount += 1;
  breaker.lastFailureTime = Date.now();

  if (breaker.failureCount >= 3) {
    breaker.state = 'OPEN';
    Logger.warn('Circuit breaker opened', {
      service: serviceName,
      failureCount: breaker.failureCount,
    });
  }

  circuitBreakerState[serviceName] = breaker;
};

// Helper to record success (reset failures)
const recordSuccess = (serviceName) => {
  const breaker = circuitBreakerState[serviceName];
  if (breaker) {
    breaker.failureCount = 0;
    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      Logger.info('Circuit breaker closed after successful request', {
        service: serviceName,
      });
    }
  }
};

// Retry logic with exponential backoff
const retryRequest = async (
  method,
  url,
  config = {},
  maxRetries = 3
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await serviceClient({
        method,
        url,
        ...config,
      });

      // Record success for circuit breaker
      const serviceName = Object.entries(SERVICES).find(
        ([key, value]) => url.includes(value)
      )?.[0];
      if (serviceName) {
        recordSuccess(serviceName);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delayMs = Math.pow(2, attempt - 1) * 100;
        Logger.warn(`Request failed, retrying (attempt ${attempt}/${maxRetries})`, {
          url,
          delayMs,
          error: error.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

// Main function to proxy requests to microservices
const proxyRequest = async (req, res, serviceName, path, options = {}) => {
  try {
    // Check circuit breaker
    checkCircuitBreaker(serviceName);

    const serviceUrl = SERVICES[serviceName];
    if (!serviceUrl) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const fullUrl = `${serviceUrl}${path}`;

    // Prepare request configuration
    const config = {
      method: req.method,
      url: fullUrl,
      headers: {
        ...req.headers,
        'X-Forwarded-For': req.ip,
        'X-User-Id': req.user?.id || 'anonymous',
        'X-Request-Path': req.path,
      },
      data: req.body,
      ...options,
    };

    // Remove host header for service-to-service calls
    delete config.headers.host;

    // Make request with retry logic
    const response = await retryRequest(
      req.method,
      fullUrl,
      config,
      3 // max retries
    );

    // Return response from service to client
    res.status(response.status).json(response.data);
  } catch (error) {
    Logger.error(`Error proxying request to ${serviceName}`, {
      service: serviceName,
      path,
      error: error.message,
    });

    // Record failure for circuit breaker
    recordFailure(serviceName);

    // Return error response
    let statusCode = 502; // Bad Gateway
    let errorMessage = 'Service unavailable';
    let errorCode = 'SERVICE_UNAVAILABLE';

    if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable';
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 504;
      errorMessage = 'Service request timeout';
      errorCode = 'GATEWAY_TIMEOUT';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode,
    });
  }
};

// Helper to make service-to-service calls (from routes)
const callService = async (serviceName, path, options = {}) => {
  try {
    checkCircuitBreaker(serviceName);

    const serviceUrl = SERVICES[serviceName];
    const fullUrl = `${serviceUrl}${path}`;

    const response = await retryRequest('get', fullUrl, options, 3);
    recordSuccess(serviceName);

    return response.data;
  } catch (error) {
    recordFailure(serviceName);
    Logger.error(`Service-to-service call failed: ${serviceName}`, {
      service: serviceName,
      path,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  SERVICES,
  proxyRequest,
  callService,
  retryRequest,
  resetCircuitBreaker,
};
