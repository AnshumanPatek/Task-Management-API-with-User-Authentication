const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createCategoryValidator,
  categoryIdValidator,
} = require('../validators/categoryValidator');

// All routes require authentication
router.use(authenticate);

// GET /api/categories - Get all categories
router.get('/', categoryController.getCategories);

// POST /api/categories - Create a new category
router.post('/', createCategoryValidator, validate, categoryController.createCategory);

// PUT /api/categories/:id - Update a category
router.put('/:id', categoryIdValidator, createCategoryValidator, validate, categoryController.updateCategory);

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', categoryIdValidator, validate, categoryController.deleteCategory);

module.exports = router;

