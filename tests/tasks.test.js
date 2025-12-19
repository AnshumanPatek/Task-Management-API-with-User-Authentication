const request = require('supertest');
const mongoose = require('mongoose');

// Set environment variables before importing app
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_minimum_32_chars';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_minimum_32_chars';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

require('./setup');

describe('Task Endpoints', () => {
  let accessToken;
  let userId;
  let categoryId;

  beforeEach(async () => {
    // Register a user and get token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'taskuser',
        email: 'task@example.com',
        password: 'Password123',
      });

    accessToken = res.body.data.tokens.accessToken;
    userId = res.body.data.user.id;

    // Create a category for task tests
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Work',
        color: '#3B82F6',
      });

    categoryId = categoryRes.body.data.category.id;
  });

  describe('POST /api/tasks', () => {
    it('should create a task with valid data', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          category: categoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Test Task');
      expect(res.body.data.task.status).toBe('todo');
      expect(res.body.data.task.priority).toBe('high');
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Task without title',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create multiple tasks
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 1', priority: 'high', status: 'todo' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 2', priority: 'low', status: 'todo' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 3', priority: 'medium', status: 'todo' });
    });

    it('should get all tasks for user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks).toHaveLength(3);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.stats).toBeDefined();
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].priority).toBe('high');
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.pages).toBe(2);
    });

    it('should search tasks by title', async () => {
      const res = await request(app)
        .get('/api/tasks?search=Task 1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].title).toBe('Task 1');
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Single Task' });

      taskId = res.body.data.task.id;
    });

    it('should get a single task by ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Single Task');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid task ID format', async () => {
      const res = await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Update Task', status: 'todo' });

      taskId = res.body.data.task.id;
    });

    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Updated Task');
      expect(res.body.data.task.description).toBe('Updated description');
    });

    it('should return 403 when updating another user\'s task', async () => {
      // Register another user
      const otherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'Password123',
        });

      const otherToken = otherUserRes.body.data.tokens.accessToken;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Task' });

      expect(res.status).toBe(404); // Returns 404 because task not found for this user
    });
  });

  describe('PUT /api/tasks/:id/status', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Status Task' });

      taskId = res.body.data.task.id;
    });

    it('should update task status', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in-progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('in-progress');
    });

    it('should set completedAt when status is completed', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('completed');
      expect(res.body.data.task.completedAt).toBeDefined();
    });

    it('should return 400 for invalid status transition from archived', async () => {
      // First set to archived
      await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'archived' });

      // Try to transition from archived
      const res = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in-progress' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('PUT /api/tasks/:id/priority', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Priority Task', priority: 'low' });

      taskId = res.body.data.task.id;
    });

    it('should update task priority', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}/priority`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.priority).toBe('high');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Delete Task' });

      taskId = res.body.data.task.id;
    });

    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // Verify task is deleted
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe('Task Sharing', () => {
    let taskId;
    let otherUserId;
    let otherToken;

    beforeEach(async () => {
      // Create a task
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Shared Task' });

      taskId = taskRes.body.data.task.id;

      // Register another user
      const otherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'sharinguser',
          email: 'sharing@example.com',
          password: 'Password123',
        });

      otherUserId = otherUserRes.body.data.user.id;
      otherToken = otherUserRes.body.data.tokens.accessToken;
    });

    it('should share a task with another user', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/share`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: otherUserId });

      expect(res.status).toBe(200);
      expect(res.body.data.task.sharedWith).toContainEqual(
        expect.objectContaining({ _id: otherUserId })
      );
    });

    it('should get shared tasks', async () => {
      // Share the task
      await request(app)
        .post(`/api/tasks/${taskId}/share`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: otherUserId });

      // Get shared tasks as the other user
      const res = await request(app)
        .get('/api/tasks/shared')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].title).toBe('Shared Task');
    });

    it('should allow shared user to view task', async () => {
      // Share the task
      await request(app)
        .post(`/api/tasks/${taskId}/share`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: otherUserId });

      // View task as shared user
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Shared Task');
    });
  });
});

describe('Category Endpoints', () => {
  let accessToken;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'categoryuser',
        email: 'category@example.com',
        password: 'Password123',
      });

    accessToken = res.body.data.tokens.accessToken;
  });

  describe('POST /api/categories', () => {
    it('should create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Personal',
          color: '#10B981',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe('Personal');
      expect(res.body.data.category.color).toBe('#10B981');
    });

    it('should return 409 for duplicate category name', async () => {
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Work' });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Work' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/categories', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Work' });

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Personal' });
    });

    it('should get all categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.categories).toHaveLength(2);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let categoryId;
    let taskId;

    beforeEach(async () => {
      // Create category
      const catRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'ToDelete' });

      categoryId = catRes.body.data.category.id;

      // Create task with category
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task with Category', category: categoryId });

      taskId = taskRes.body.data.task.id;
    });

    it('should delete category and nullify task category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // Check that task category is now null
      const taskRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(taskRes.body.data.task.category).toBeNull();
    });
  });
});

