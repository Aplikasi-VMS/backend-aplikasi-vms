// middlewares/error.middleware.js
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';

const errorMiddleware = (err, req, res, next) => {
  try {
    let error = { ...err };
    error.message = err.message;

    // Prisma: Record not found (P2025)
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        error.message = 'Resource not found.';
        error.statusCode = 404;
      }

      // Prisma: Unique constraint failed (P2002)
      if (err.code === 'P2002') {
        const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
        error.message = `Duplicate entry for field: ${field || 'unknown field'}. Please use a unique value.`;
        error.statusCode = 400;
      }

      // Prisma: Other known request errors
      if (!error.statusCode) {
        error.message = 'A database error occurred during your request.';
        error.statusCode = 400;
      }
    }

    // --- REFINED HANDLING FOR PrismaClientValidationError ---
    if (err instanceof PrismaClientValidationError) {
      // Parse the verbose Prisma validation message to be more user-friendly.
      // Example message: "Argument `type`: Invalid value provided. Expected Int, provided String."
      const validationMatch = err.message.match(/Argument `(.*?)`: Invalid value provided\. Expected (.*?), provided (.*?)\./);

      if (validationMatch && validationMatch.length >= 4) {
        const fieldName = validationMatch[1];
        const expectedType = validationMatch[2];
        // You can use 'providedType' if you want, but often 'expectedType' is enough.
        // const providedType = validationMatch[3];
        error.message = `Invalid value for '${fieldName}'. Expected a ${expectedType}.`;
      } else {
        // Fallback for other validation errors not matching the pattern
        error.message = 'Invalid data provided for one or more fields. Please check your input.';
      }
      error.statusCode = 400;
    }
    // --- END REFINED HANDLING ---

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
      error.message = 'File size is too large. Max allowed size is 10MB.'; // Or whatever your limit is
      error.statusCode = 400;
    }

    // SyntaxError from body parser (e.g., malformed JSON)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      error.message = 'Invalid data format. Please ensure your request body is valid JSON.';
      error.statusCode = 400;
    }

    // Default to a generic server error if no specific handling
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