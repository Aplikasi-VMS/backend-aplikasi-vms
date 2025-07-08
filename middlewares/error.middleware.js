// middlewares/error.middleware.js

// Perhatikan bahwa kita mengimpor secara eksplisit tipe error dari '@prisma/client/runtime/library'
// Ini adalah cara yang lebih robust untuk mendapatkan konstruktor error Prisma
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';

const errorMiddleware = (err, req, res, next) => {
  try {
    let error = { ...err };
    error.message = err.message;

    // Prisma: Record not found
    // Gunakan konstruktor yang diimpor secara eksplisit
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        error.message = 'Resource not found';
        error.statusCode = 404;
      }

      // Prisma: Unique constraint failed (duplicate)
      if (err.code === 'P2002') {
        // Pastikan err.meta.target ada sebelum mengaksesnya
        const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
        error.message = `Duplicate value for field: ${field || 'unknown'}`;
        error.statusCode = 400;
      }

      // Prisma: Other known request errors (jika belum ada statusCode)
      if (!error.statusCode) { // Cek apakah statusCode sudah ditetapkan
        error.message = 'Database request error';
        error.statusCode = 400;
      }
    }

    // Prisma: Validation error
    // Gunakan konstruktor yang diimpor secara eksplisit
    if (err instanceof PrismaClientValidationError) {
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
    // err.status is from body-parser SyntaxError
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
    console.error('Error in errorMiddleware itself (THIS IS BAD!):', internalError);
    // Jika middleware penanganan error gagal, kirim respons 500 generik
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing another error.',
    });
  }
};

export default errorMiddleware;