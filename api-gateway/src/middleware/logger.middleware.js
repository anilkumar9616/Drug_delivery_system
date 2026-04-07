// API Gateway - Logging Middleware
// Logs all incoming requests and responses for monitoring and debugging

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Custom Morgan format with additional details
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Morgan middleware for HTTP request logging
const requestLogger = morgan(morganFormat, {
  stream: accessLogStream,
});

// Console logger for development (optional)
const consoleLogger = morgan(morganFormat);

// Custom application logging
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    console.log(JSON.stringify(logEntry));

    // Write to file
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static info(message, data) {
    this.log('INFO', message, data);
  }

  static error(message, data) {
    this.log('ERROR', message, data);
  }

  static warn(message, data) {
    this.log('WARN', message, data);
  }

  static debug(message, data) {
    this.log('DEBUG', message, data);
  }
}

// Middleware to log API request/response details
const apiLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  Logger.info('API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    query: req.query,
    body: req.body && Object.keys(req.body).length > 0 ? req.body : null,
  });

  // Intercept response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    // Log response
    Logger.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
    });

    return originalSend.call(this, data);
  };

  next();
};

// Middleware for logging errors
const errorLogger = (err, req, res, next) => {
  Logger.error('Error occurred', {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.id || 'anonymous',
  });

  next(err); // Pass to error handler
};

module.exports = {
  requestLogger,
  consoleLogger,
  apiLogger,
  errorLogger,
  Logger,
};
