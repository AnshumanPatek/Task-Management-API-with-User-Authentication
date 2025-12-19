const taskService = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get all tasks with filters
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getTasks(req.userId, req.query);
    
    ApiResponse.success(res, result, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single task
 * GET /api/tasks/:id
 */
const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.userId);
    
    ApiResponse.success(res, { task }, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.userId, req.body);
    
    ApiResponse.created(res, { task }, 'Task created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.userId, req.body);
    
    ApiResponse.success(res, { task }, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.userId);
    
    ApiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status
 * PUT /api/tasks/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.userId,
      req.body.status
    );
    
    ApiResponse.success(res, { task }, 'Task status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Update task priority
 * PUT /api/tasks/:id/priority
 */
const updatePriority = async (req, res, next) => {
  try {
    const task = await taskService.updateTaskPriority(
      req.params.id,
      req.userId,
      req.body.priority
    );
    
    ApiResponse.success(res, { task }, 'Task priority updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Share task with another user
 * POST /api/tasks/:id/share
 */
const shareTask = async (req, res, next) => {
  try {
    const task = await taskService.shareTask(
      req.params.id,
      req.userId,
      req.body.userId
    );
    
    ApiResponse.success(res, { task }, 'Task shared successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks shared with current user
 * GET /api/tasks/shared
 */
const getSharedTasks = async (req, res, next) => {
  try {
    const result = await taskService.getSharedTasks(req.userId, req.query);
    
    ApiResponse.success(res, result, 'Shared tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Unshare task with a user
 * DELETE /api/tasks/:id/share/:userId
 */
const unshareTask = async (req, res, next) => {
  try {
    const task = await taskService.unshareTask(
      req.params.id,
      req.userId,
      req.params.userId
    );
    
    ApiResponse.success(res, { task }, 'Task unshared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateStatus,
  updatePriority,
  shareTask,
  getSharedTasks,
  unshareTask,
};

