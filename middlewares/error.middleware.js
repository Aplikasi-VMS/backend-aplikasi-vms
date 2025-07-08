import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

const errorMiddleware = (err, req, res, next) => {
  try {
    let error = { ...err };
    error.message = err.message;

    // Prisma: Record not found (P2025)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        error.message = 'Resource not found.';
        error.statusCode = 404;
      }

      if (err.code === 'P2002') {
        const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
        error.message = `Duplicate entry for field: ${field || 'unknown field'}. Please use a unique value.`;
        error.statusCode = 400;
      }

      if (!error.statusCode) {
        error.message = 'A database error occurred during your request.';
        error.statusCode = 400;
      }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      const validationMatch = err.message.match(/Argument `(.*?)`: Invalid value provided\. Expected (.*?), provided (.*?)\./);
      if (validationMatch && validationMatch.length >= 4) {
        const fieldName = validationMatch[1];
        const expectedType = validationMatch[2];
        error.message = `Invalid value for '${fieldName}'. Expected a ${expectedType}.`;
      } else {
        error.message = 'Invalid data provided for one or more fields. Please check your input.';
      }
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

    // Multer file upload error
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File size is too large. Max allowed size is 10MB.';
      error.statusCode = 400;
    }

    // SyntaxError from body parser
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Invalid data format. Please ensure your request body is valid JSON.';
      error.statusCode = 400;
    }

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'An unexpected server error occurred.',
    });
  } catch (internalError) {
    console.error('Error in errorMiddleware itself (critical!):', internalError);
    res.status(500).json({
      success: false,
      error: 'A critical server error occurred during error processing.',
    });
  }
};

export default errorMiddleware;
