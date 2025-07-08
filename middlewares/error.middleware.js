import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library.js';
import jwt from 'jsonwebtoken';

const errorMiddleware = (err, req, res, next) => {
  try {
    console.error('Middleware caught error:', err);

    let error = {
      message: err?.message || 'An unexpected error occurred.',
      statusCode: err?.statusCode,
    };

    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        error.message = 'Resource not found.';
        error.statusCode = 404;
      } else if (err.code === 'P2002') {
        const field = err.meta && Array.isArray(err.meta.target)
          ? err.meta.target.join(', ')
          : (err.meta?.target || 'unknown field');
        error.message = `Duplicate entry for field: ${field}. Please use a unique value.`;
        error.statusCode = 400;
      } else {
        error.message = 'A database error occurred during your request.';
        error.statusCode = 400;
      }
    }

    if (err instanceof PrismaClientValidationError) {
      error.message = 'Invalid data provided. Please check your input.';
      error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error.message = 'Authentication failed: Invalid token.';
      error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
      error.message = 'Authentication failed: Token expired. Please log in again.';
      error.statusCode = 401;
    }

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  } catch (internalError) {
    console.error('Error in errorMiddleware itself (critical!):', internalError);
    console.error('Original error that triggered middleware:', err);
    res.status(500).json({
      success: false,
      error: 'A critical server error occurred during error processing.',
    });
  }
};

export default errorMiddleware;
