const categoryService = require('../services/categoryService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get all categories
 * GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories(req.userId);
    
    ApiResponse.success(res, { categories }, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.userId, req.body);
    
    ApiResponse.created(res, { category }, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.userId,
      req.body
    );
    
    ApiResponse.success(res, { category }, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id, req.userId);
    
    ApiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

