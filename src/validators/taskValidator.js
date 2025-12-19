const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Helper to validate MongoDB ObjectId
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Task title cannot exceed 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),

  body('category')
    .optional()
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
];

const updateTaskValidator = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid task ID');
      }
      return true;
    }),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Task title cannot exceed 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed', 'archived'])
    .withMessage('Invalid status value'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),

  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('category')
    .optional({ nullable: true })
    .custom((value) => {
      if (value !== null && !isValidObjectId(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('estimatedHours')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
];

const taskIdValidator = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid task ID');
      }
      return true;
    }),
];

const updateStatusValidator = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid task ID');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['todo', 'in-progress', 'completed', 'archived'])
    .withMessage('Invalid status value'),
];

const updatePriorityValidator = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid task ID');
      }
      return true;
    }),

  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
];

const shareTaskValidator = [
  param('id')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid task ID');
      }
      return true;
    }),

  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid user ID');
      }
      return true;
    }),
];

const getTasksValidator = [
  query('status')
    .optional()
    .custom((value) => {
      const statuses = value.split(',');
      const validStatuses = ['todo', 'in-progress', 'completed', 'archived'];
      for (const status of statuses) {
        if (!validStatuses.includes(status.trim())) {
          throw new Error(`Invalid status: ${status}`);
        }
      }
      return true;
    }),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority value'),

  query('category')
    .optional()
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  updateStatusValidator,
  updatePriorityValidator,
  shareTaskValidator,
  getTasksValidator,
};

