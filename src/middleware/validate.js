const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware wrapper
 * Checks for validation errors and returns standardized error response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const details = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    throw ApiError.validationError('Invalid input data', details);
  }
  
  next();
};

module.exports = validate;

