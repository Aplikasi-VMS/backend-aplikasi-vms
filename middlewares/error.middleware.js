import { Prisma } from '../generated/prisma/index.js';
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
    message: err.message || 'Terjadi kesalahan pada sistem',
    statusCode: err.statusCode || 500,
    isOperational: false
  };

  try {
    if (err instanceof Prisma.PrismaClientInitializationError) {
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

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error.isOperational = true;

      switch (err.code) {
        case 'P2002':
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

        case 'P2025':
          error.message = 'Data yang diminta tidak ditemukan.';
          error.statusCode = 404;
          break;

        case 'P2003':
          error.message = 'Data terkait tidak valid.';
          error.statusCode = 400;
          break;

        default:
          error.message = 'Terjadi kesalahan pada operasi database.';
          error.statusCode = 400;
          error.isOperational = true;
          logger.error({
            type: 'DatabaseOperationError',
            code: err.code || 'UNKNOWN_DB_ERROR',
            message: 'Kesalahan operasi database yang tidak terduga',
            path: req.path,
            method: req.method,
            severity: 'ERROR',
            timestamp: new Date().toISOString(),
            originalError: redactSensitiveData(err)
          });
          break;
      }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
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
    } else if (err instanceof jwt.JsonWebTokenError) {
      error.message = 'Token autentikasi tidak valid.';
      error.statusCode = 401;
      error.isOperational = true;
    } else if (err instanceof jwt.TokenExpiredError) {
      error.message = 'Sesi telah berakhir. Silakan login kembali.';
      error.statusCode = 401;
      error.isOperational = true;
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'Ukuran file melebihi batas maksimal 10MB.';
      error.statusCode = 413;
      error.isOperational = true;
    } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Format data request tidak valid.';
      error.statusCode = 400;
      error.isOperational = true;
    }


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
        response.error = 'Terjadi kesalahan pada server';
      }
      delete response.details;
    }
    return res.status(error.statusCode).json(response);

  } catch (middlewareError) {
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