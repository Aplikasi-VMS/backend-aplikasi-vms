// middlewares/errorMiddleware.js
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

const errorMiddleware = (err, req, res, next) => {
  try {
    let error = { ...err };
    error.message = err.message;

    console.error(err); // log full error untuk debugging

    // Prisma: Record not found
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        error.message = 'Resource not found';
        error.statusCode = 404;
      }

      // Prisma: Unique constraint failed (duplicate)
      if (err.code === 'P2002') {
        error.message = `Duplicate value for field: ${err.meta.target}`;
        error.statusCode = 400;
      }

      // Prisma: Other known request errors
      if (!error.statusCode) {
        error.message = 'Database request error';
        error.statusCode = 400;
      }
    }

    // Prisma: Validation error
    if (err instanceof Prisma.PrismaClientValidationError) {
      error.message = err.message;
      error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error.message = 'Invalid token';
      error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
      error.message = 'Token expired';
      error.statusCode = 401;
    }

    // Multer file upload error
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File size is too large';
      error.statusCode = 400;
    }

    // SyntaxError from body parser
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Invalid JSON payload';
      error.statusCode = 400;
    }

    // Default to server error
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error',
    });
  } catch (internalError) {
    console.error('Error in errorMiddleware:', internalError);
    next(internalError);
  }
};

export default errorMiddleware;
