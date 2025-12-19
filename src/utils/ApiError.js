/**
 * Custom API Error class for standardized error handling
 */
class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static validationError(message, details = null) {
    return new ApiError(400, message, 'VALIDATION_ERROR', details);
  }

  static invalidStatusTransition(message) {
    return new ApiError(400, message, 'INVALID_STATUS_TRANSITION');
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static invalidCredentials(message = 'Invalid credentials') {
    return new ApiError(401, message, 'INVALID_CREDENTIALS');
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

module.exports = ApiError;

