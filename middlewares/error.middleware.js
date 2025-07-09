import { PrismaClientKnownRequestError, PrismaClientValidationError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';

function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password', 'creditCard', 'token', 'authorization',
    'refreshToken', 'pin', 'securityCode', 'cvv', 'apiKey'
  ];

  const redactValue = (value) => {
    if (value && typeof value === 'object') {
      return redactSensitiveData(value);
    }
    return '**REDACTED**';
  };

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = sensitiveFields.includes(key) ? redactValue(value) : redactSensitiveData(value);
    return acc;
  }, {});
}

const errorMiddleware = (err, req, res, next) => {
  const error = {
    ...err,
    message: err.message || 'An unexpected error occurred',
    statusCode: err.statusCode || 500,
    isOperational: Boolean(err.isOperational)
  };

  try {
    if (err instanceof PrismaClientInitializationError) {
      error.message = 'Service temporarily unavailable. Please try again later.';
      error.statusCode = 503;
      error.isOperational = true;

      logger.error({
        type: 'DatabaseConnectionError',
        message: 'Database connection failed',
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

      logger.error({
        type: 'DatabaseError',
        code: err.code,
        message: error.message,
        path: req.path,
        method: req.method,
        severity: error.statusCode >= 500 ? 'ERROR' : 'WARNING',
        timestamp: new Date().toISOString(),
        meta: redactSensitiveData(err.meta)
      });
    }
    else if (err instanceof PrismaClientValidationError) {
      error.message = 'Invalid data provided for one or more fields.';
      error.statusCode = 422;

      logger.error({
        type: 'ValidationError',
        message: 'Data validation failed',
        path: req.path,
        method: req.method,
        severity: 'WARNING',
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development'
          ? err.message.split('\n')[0]
          : undefined
      });
    }
    else if (err instanceof jwt.JsonWebTokenError) {
      error.message = 'Invalid authentication credentials.';
      error.statusCode = 401;
      error.isOperational = true;

      logger.warn({
        type: 'AuthenticationError',
        message: 'Invalid JWT token',
        path: req.path,
        method: req.method,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    else if (err instanceof jwt.TokenExpiredError) {
      error.message = 'Authentication session expired. Please log in again.';
      error.statusCode = 401;
      error.isOperational = true;

      logger.warn({
        type: 'AuthenticationError',
        message: 'Expired JWT token',
        path: req.path,
        method: req.method,
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      });
    }
    else if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'The uploaded file exceeds the maximum allowed size of 10MB.';
      error.statusCode = 413;
      error.isOperational = true;
    }
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Invalid request data format.';
      error.statusCode = 400;
      error.isOperational = true;
    }
    else if (error.isOperational) {
      logger.error('Unhandled error', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    else {
      logger.error({
        type: err.name || 'UnknownError',
        message: 'Unhandled system error',
        code: err.code || 'UNKNOWN',
        path: req.path,
        method: req.method,
        severity: 'ERROR',
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }

    const response = {
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          type: err.name,
          code: err.code,
          ...(error.statusCode < 500 && { stack: err.stack })
        }
      })
    };

    if (process.env.NODE_ENV === 'production') {
      if (error.statusCode >= 500) {
        response.error = 'An internal server error occurred';
      }
      delete response.details;
    }

    return res.status(error.statusCode).json(response);

  } catch (middlewareError) {
    logger.error({
      type: 'MiddlewareError',
      message: 'Error handler failed',
      severity: 'EMERGENCY',
      timestamp: new Date().toISOString(),
      error: {
        message: middlewareError.message,
        stack: middlewareError.stack
      },
      originalError: {
        message: err.message,
        stack: err.stack
      }
    });

    return res.status(500).json({
      success: false,
      error: 'A critical system error occurred'
    });
  }
};

export default errorMiddleware;