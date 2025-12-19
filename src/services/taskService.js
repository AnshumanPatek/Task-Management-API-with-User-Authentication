const Task = require('../models/Task');
const Category = require('../models/Category');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const categoryService = require('./categoryService');

/**
 * Get all tasks for a user with filters, pagination, and stats
 */
const getTasks = async (userId, queryParams) => {
  const {
    status,
    priority,
    category,
    search,
    'dueDate[gte]': dueDateGte,
    'dueDate[lte]': dueDateLte,
    page = 1,
    limit = 10,
    sortBy = 'createdAt:desc',
  } = queryParams;

  // Build filter query
  const filter = { user: userId };

  // Status filter (can be comma-separated)
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = { $in: statuses };
  }

  // Priority filter
  if (priority) {
    filter.priority = priority;
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Search in title and description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Due date range filter
  if (dueDateGte || dueDateLte) {
    filter.dueDate = {};
    if (dueDateGte) filter.dueDate.$gte = new Date(dueDateGte);
    if (dueDateLte) filter.dueDate.$lte = new Date(dueDateLte);
  }

  // Parse sort parameter
  const [sortField, sortOrder] = sortBy.split(':');
  const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute queries in parallel
  const [tasks, total, stats] = await Promise.all([
    Task.find(filter)
      .populate('category', 'name color')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(filter),
    getTaskStats(userId),
  ]);

  // Transform tasks
  const transformedTasks = tasks.map((task) => ({
    ...task,
    id: task._id,
    _id: undefined,
    __v: undefined,
  }));

  return {
    tasks: transformedTasks,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
    stats,
  };
};

/**
 * Get task statistics for a user
 */
const getTaskStats = async (userId) => {
  const stats = await Task.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    todo: 0,
    inProgress: 0,
    completed: 0,
    archived: 0,
  };

  stats.forEach((stat) => {
    const key = stat._id === 'in-progress' ? 'inProgress' : stat._id;
    result[key] = stat.count;
  });

  return result;
};

/**
 * Get a single task by ID
 */
const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId })
    .populate('category', 'name color')
    .populate('sharedWith', 'username email');

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Check if user owns the task or task is shared with them
  const isOwner = task.user.toString() === userId.toString();
  const isShared = task.sharedWith.some(
    (u) => u._id.toString() === userId.toString()
  );

  if (!isOwner && !isShared) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  return task;
};

/**
 * Create a new task
 */
const createTask = async (userId, taskData) => {
  const { title, description, priority, dueDate, category, tags, estimatedHours } = taskData;

  // Verify category belongs to user if provided
  if (category) {
    const categoryExists = await Category.findOne({ _id: category, user: userId });
    if (!categoryExists) {
      throw ApiError.badRequest('Invalid category');
    }
  }

  const task = await Task.create({
    title,
    description,
    priority,
    dueDate,
    category,
    tags,
    estimatedHours,
    user: userId,
  });

  // Increment category task count
  if (category) {
    await categoryService.incrementTaskCount(category);
  }

  return task;
};

/**
 * Update a task
 */
const updateTask = async (taskId, userId, updateData) => {
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // If status is changing, validate the transition
  if (updateData.status && updateData.status !== task.status) {
    if (!task.canTransitionTo(updateData.status)) {
      throw ApiError.invalidStatusTransition(
        `Cannot transition from ${task.status} to ${updateData.status}`
      );
    }
  }

  // If category is changing, verify new category and update counts
  if (updateData.category !== undefined && updateData.category !== task.category?.toString()) {
    if (updateData.category) {
      const categoryExists = await Category.findOne({ _id: updateData.category, user: userId });
      if (!categoryExists) {
        throw ApiError.badRequest('Invalid category');
      }
    }
    await categoryService.updateTaskCounts(task.category, updateData.category);
  }

  // Update task
  Object.assign(task, updateData);
  await task.save();

  return task;
};

/**
 * Delete a task
 */
const deleteTask = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Decrement category task count
  if (task.category) {
    await categoryService.decrementTaskCount(task.category);
  }

  await task.deleteOne();

  return true;
};

/**
 * Update task status only
 */
const updateTaskStatus = async (taskId, userId, newStatus) => {
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (!task.canTransitionTo(newStatus)) {
    throw ApiError.invalidStatusTransition(
      `Cannot transition from ${task.status} to ${newStatus}`
    );
  }

  task.status = newStatus;
  await task.save();

  return task;
};

/**
 * Update task priority only
 */
const updateTaskPriority = async (taskId, userId, newPriority) => {
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  task.priority = newPriority;
  await task.save();

  return task;
};

/**
 * Share task with another user
 */
const shareTask = async (taskId, ownerId, targetUserId) => {
  const task = await Task.findOne({ _id: taskId, user: ownerId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Check if target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  // Can't share with yourself
  if (ownerId.toString() === targetUserId.toString()) {
    throw ApiError.badRequest('Cannot share task with yourself');
  }

  // Check if already shared
  const alreadyShared = task.sharedWith.some(
    (u) => u.toString() === targetUserId.toString()
  );

  if (alreadyShared) {
    throw ApiError.conflict('Task is already shared with this user');
  }

  // Add user to sharedWith array
  task.sharedWith.push(targetUserId);
  await task.save();

  return task;
};

/**
 * Get tasks shared with user
 */
const getSharedTasks = async (userId, queryParams) => {
  const { page = 1, limit = 10 } = queryParams;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [tasks, total] = await Promise.all([
    Task.find({ sharedWith: userId })
      .populate('user', 'username email')
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Task.countDocuments({ sharedWith: userId }),
  ]);

  const transformedTasks = tasks.map((task) => ({
    ...task,
    id: task._id,
    _id: undefined,
    __v: undefined,
  }));

  return {
    tasks: transformedTasks,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Unshare task with a user
 */
const unshareTask = async (taskId, ownerId, targetUserId) => {
  const task = await Task.findOne({ _id: taskId, user: ownerId });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  task.sharedWith = task.sharedWith.filter(
    (u) => u.toString() !== targetUserId.toString()
  );
  await task.save();

  return task;
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
  shareTask,
  getSharedTasks,
  unshareTask,
  getTaskStats,
};

