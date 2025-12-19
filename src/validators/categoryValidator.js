const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),

  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color (e.g., #3B82F6)'),
];

const categoryIdValidator = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),
];

module.exports = {
  createCategoryValidator,
  categoryIdValidator,
};

