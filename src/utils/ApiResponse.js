/**
 * Standardized API Response class
 */
class ApiResponse {
  /**
   * Send success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   */
  static created(res, data = null, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send error response
   */
  static error(res, error) {
    const statusCode = error.statusCode || 500;
    const response = {
      success: false,
      error: {
        code: error.code || 'ERROR',
        message: error.message || 'An error occurred',
        timestamp: error.timestamp || new Date().toISOString(),
      },
    };

    if (error.details) {
      response.error.details = error.details;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;

