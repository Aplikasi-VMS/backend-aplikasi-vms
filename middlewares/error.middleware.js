import { PrismaClientKnownRequestError, PrismaClientValidationError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';

// Enhanced sensitive data redaction
function redactSensitiveData(body) {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = [
    'password',
    'creditCard',
    'token',
    'authorization',
    'refreshToken',
    'pin',
    'securityCode',
    'cvv'
  ];

  return Object.entries(body).reduce((acc, [key, value]) => {
    acc[key] = sensitiveFields.includes(key) ? '**REDACTED**' : value;
    return acc;
  }, {});
}

const errorMiddleware = (err, req, res, next) => {
  // Initialize error object with safe defaults
  const error = {
    ...err,
    message: err.message || 'An unexpected error occurred',
    statusCode: err.statusCode || 500,
    isOperational: Boolean(err.isOperational)
  };

  try {
    // Database Connection Errors
    if (err instanceof PrismaClientInitializationError) {
      error.message = 'Service temporarily unavailable. Please try again later.';
      error.statusCode = 503;
      error.isOperational = true;

      logger.error('Database connection failure', {
        type: 'DatabaseConnectionError',
        message: 'Cannot establish database connection',
        code: 'DB_CONNECTION_FAILED',
        path: req.path,
        method: req.method,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      });

      return res.status(503).json({
        success: false,
        error: error.message
      });
    }

    // Prisma Known Errors
    if (err instanceof PrismaClientKnownRequestError) {
      switch (err.code) {
        case 'P2025':
          error.message = 'The requested resource was not found.';
          error.statusCode = 404;
          break;
        case 'P2002':
          const field = err.meta?.target?.join?.('_') || 'unknown_field';
          error.message = `The ${field} must be unique.`;
          error.statusCode = 409;
          break;
        case 'P2003':
          error.message = 'Invalid reference to related resource.';
          error.statusCode = 400;
          break;
        case 'P2016':
          error.message = 'Invalid data format in query.';
          error.statusCode = 400;
          break;
        default:
          error.message = 'Database operation failed.';
          error.statusCode = 400;
      }

      logger.error('Database operation failed', {
        type: 'DatabaseError',
        code: err.code,
        message: error.message,
        path: req.path,
        method: req.method,
        severity: error.statusCode >= 500 ? 'ERROR' : 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    // Prisma Validation Errors
    else if (err instanceof PrismaClientValidationError) {
      error.message = 'Invalid data provided for one or more fields.';
      error.statusCode = 422;

      logger.error('Validation failed', {
        type: 'ValidationError',
        message: err.message.split('\n')[0], // First line only
        path: req.path,
        method: req.method,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    // JWT Errors
    else if (err instanceof jwt.JsonWebTokenError) {
      error.message = 'Invalid authentication credentials.';
      error.statusCode = 401;
    }
    else if (err instanceof jwt.TokenExpiredError) {
      error.message = 'Authentication session expired. Please log in again.';
      error.statusCode = 401;
    }
    // File Upload Errors
    else if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'The uploaded file exceeds the maximum allowed size of 10MB.';
      error.statusCode = 413;
    }
    // JSON Parse Errors
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Invalid request data format.';
      error.statusCode = 400;
    }
    // Custom Operational Errors
    else if (error.isOperational) {
      // Already has proper statusCode and message
    }
    // Unknown Errors
    else {
      logger.error('Unhandled system error', {
        type: err.name || 'UnknownError',
        message: err.message,
        code: err.code || 'UNKNOWN',
        stack: err.stack,
        path: req.path,
        method: req.method,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
    }

    const response = {
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          type: err.name,
          code: err.code
        }
      })
    };

    if (process.env.NODE_ENV === 'production' && error.statusCode >= 500) {
      response.error = 'An internal server error occurred';
      delete response.details;
    }

    return res.status(error.statusCode).json(response);

  } catch (middlewareError) {
    logger.error('Error middleware failure', {
      type: 'MiddlewareError',
      message: middlewareError.message,
      originalError: {
        message: err.message,
        stack: err.stack
      },
      severity: 'EMERGENCY',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      error: 'A critical system error occurred'
    });
  }
};

export default errorMiddleware;