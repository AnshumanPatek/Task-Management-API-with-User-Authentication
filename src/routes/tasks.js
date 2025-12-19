const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  updateStatusValidator,
  updatePriorityValidator,
  shareTaskValidator,
  getTasksValidator,
} = require('../validators/taskValidator');

// All routes require authentication
router.use(authenticate);

// GET /api/tasks/shared - Get shared tasks (must be before /:id route)
router.get('/shared', taskController.getSharedTasks);

// GET /api/tasks - Get all tasks with filters
router.get('/', getTasksValidator, validate, taskController.getTasks);

// POST /api/tasks - Create a new task
router.post('/', createTaskValidator, validate, taskController.createTask);

// GET /api/tasks/:id - Get a single task
router.get('/:id', taskIdValidator, validate, taskController.getTask);

// PUT /api/tasks/:id - Update a task
router.put('/:id', updateTaskValidator, validate, taskController.updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', taskIdValidator, validate, taskController.deleteTask);

// PUT /api/tasks/:id/status - Update task status
router.put('/:id/status', updateStatusValidator, validate, taskController.updateStatus);

// PUT /api/tasks/:id/priority - Update task priority
router.put('/:id/priority', updatePriorityValidator, validate, taskController.updatePriority);

// POST /api/tasks/:id/share - Share task with another user
router.post('/:id/share', shareTaskValidator, validate, taskController.shareTask);

// DELETE /api/tasks/:id/share/:userId - Unshare task with a user
router.delete('/:id/share/:userId', taskIdValidator, validate, taskController.unshareTask);

module.exports = router;

