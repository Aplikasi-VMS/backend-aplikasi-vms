import { PrismaClientKnownRequestError, PrismaClientValidationError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';

// Fungsi untuk menyensor data sensitif
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
  // Inisialisasi objek error
  const error = {
    ...err,
    message: err.message || 'Terjadi kesalahan pada sistem',
    statusCode: err.statusCode || 500,
    isOperational: false
  };

  try {
    // 1. Tangani error koneksi database
    if (err instanceof PrismaClientInitializationError) {
      error.message = 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.';
      error.statusCode = 503;
      error.isOperational = true;

      logger.error({
        type: 'DatabaseConnectionError',
        message: 'Gagal terhubung ke database',
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

    // 2. Tangani error Prisma yang diketahui
    if (err instanceof PrismaClientKnownRequestError) {
      error.isOperational = true;

      switch (err.code) {
        case 'P2002': // Duplicate entry
          const field = err.meta?.target?.join?.('_') || 'field_tidak_diketahui';
          error.message = `Data sudah ada: ${field} harus unik.`;
          error.statusCode = 409;

          logger.warn({
            type: 'DatabaseError',
            code: 'DUPLICATE_ENTRY',
            message: `Data duplikat pada field ${field}`,
            path: req.path,
            method: req.method,
            severity: 'WARNING',
            timestamp: new Date().toISOString(),
            meta: redactSensitiveData(err.meta)
          });
          break;

        case 'P2025': // Record not found
          error.message = 'Data yang diminta tidak ditemukan.';
          error.statusCode = 404;
          break;

        case 'P2003': // Foreign key constraint
          error.message = 'Data terkait tidak valid.';
          error.statusCode = 400;
          break;

        default:
          error.message = 'Terjadi kesalahan pada operasi database.';
          error.statusCode = 400;
      }
    }
    // 3. Tangani error validasi Prisma
    else if (err instanceof PrismaClientValidationError) {
      error.message = 'Format data tidak valid.';
      error.statusCode = 422;
      error.isOperational = true;

      logger.error({
        type: 'ValidationError',
        message: 'Validasi data gagal',
        path: req.path,
        method: req.method,
        severity: 'WARNING',
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development'
          ? err.message.split('\n')[0]
          : undefined
      });
    }
    // 4. Tangani error JWT
    else if (err instanceof jwt.JsonWebTokenError) {
      error.message = 'Token autentikasi tidak valid.';
      error.statusCode = 401;
      error.isOperational = true;
    }
    else if (err instanceof jwt.TokenExpiredError) {
      error.message = 'Sesi telah berakhir. Silakan login kembali.';
      error.statusCode = 401;
      error.isOperational = true;
    }
    // 5. Tangani error upload file
    else if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'Ukuran file melebihi batas maksimal 10MB.';
      error.statusCode = 413;
      error.isOperational = true;
    }
    // 6. Tangani error parsing JSON
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Format data request tidak valid.';
      error.statusCode = 400;
      error.isOperational = true;
    }

    // Jika error belum ditangani (unhandled)
    if (!error.isOperational) {
      logger.error({
        type: err.name || 'UnknownError',
        message: 'Kesalahan sistem tidak terduga',
        code: err.code || 'UNKNOWN',
        path: req.path,
        method: req.method,
        severity: 'ERROR',
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        originalError: redactSensitiveData({
          message: err.message,
          code: err.code,
          ...err
        })
      });
    }

    // Siapkan response untuk client
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

    // Sanitasi response di production
    if (process.env.NODE_ENV === 'production') {
      if (error.statusCode >= 500) {
        response.error = 'Terjadi kesalahan pada server';
      }
      delete response.details;
    }

    return res.status(error.statusCode).json(response);

  } catch (middlewareError) {
    // Jika error handler sendiri gagal
    logger.error({
      type: 'MiddlewareError',
      message: 'Error handler gagal',
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
      error: 'Kesalahan kritis pada sistem'
    });
  }
};

export default errorMiddleware;