// Shared Logger Utility
// Simple logging for all services

class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };
    
    const prefix = `[${timestamp}] [${level}]`;
    
    if (level === 'error') {
      console.error(prefix, message, data);
    } else if (level === 'warn') {
      console.warn(prefix, message, data);
    } else if (level === 'debug') {
      console.debug(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }
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

module.exports = Logger;
