const Category = require('../models/Category');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

/**
 * Get all categories for a user
 */
const getCategories = async (userId) => {
  const categories = await Category.find({ user: userId }).sort({ name: 1 });
  return categories;
};

/**
 * Get a single category by ID
 */
const getCategoryById = async (categoryId, userId) => {
  const category = await Category.findOne({ _id: categoryId, user: userId });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return category;
};

/**
 * Create a new category
 */
const createCategory = async (userId, categoryData) => {
  const { name, color } = categoryData;

  // Check for duplicate category name for this user
  const existingCategory = await Category.findOne({ user: userId, name });

  if (existingCategory) {
    throw ApiError.conflict('Category with this name already exists');
  }

  const category = await Category.create({
    name,
    color,
    user: userId,
  });

  return category;
};

/**
 * Update a category
 */
const updateCategory = async (categoryId, userId, updateData) => {
  const category = await Category.findOne({ _id: categoryId, user: userId });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Check for duplicate name if name is being updated
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({
      user: userId,
      name: updateData.name,
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      throw ApiError.conflict('Category with this name already exists');
    }
  }

  Object.assign(category, updateData);
  await category.save();

  return category;
};

/**
 * Delete a category
 * Sets category to null for all tasks in this category
 */
const deleteCategory = async (categoryId, userId) => {
  const category = await Category.findOne({ _id: categoryId, user: userId });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Set category to null for all tasks using this category
  await Task.updateMany(
    { category: categoryId },
    { $set: { category: null } }
  );

  await category.deleteOne();

  return true;
};

/**
 * Increment task count for a category
 */
const incrementTaskCount = async (categoryId) => {
  if (!categoryId) return;
  
  await Category.findByIdAndUpdate(categoryId, {
    $inc: { taskCount: 1 },
  });
};

/**
 * Decrement task count for a category
 */
const decrementTaskCount = async (categoryId) => {
  if (!categoryId) return;
  
  await Category.findByIdAndUpdate(categoryId, {
    $inc: { taskCount: -1 },
  });
};

/**
 * Update task counts when task category changes
 */
const updateTaskCounts = async (oldCategoryId, newCategoryId) => {
  if (oldCategoryId === newCategoryId) return;
  
  await decrementTaskCount(oldCategoryId);
  await incrementTaskCount(newCategoryId);
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  incrementTaskCount,
  decrementTaskCount,
  updateTaskCounts,
};

