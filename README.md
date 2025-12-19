# Task Management API with User Authentication

A RESTful API for task management with user authentication, built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Task Management**: Full CRUD operations for tasks
- **Categories**: Organize tasks by categories
- **Task Filtering**: Filter tasks by status, priority, category, date range
- **Pagination**: Paginated task listing with statistics
- **Task Sharing**: Share tasks with other users
- **Status Transitions**: Validated status transitions with business rules
- **Security**: Password hashing with bcrypt, token blacklisting for logout

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Testing**: Jest + Supertest

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/task-management-db

   # JWT Configuration
   JWT_ACCESS_SECRET=your_access_token_secret_key_here_min_32_chars
   JWT_REFRESH_SECRET=your_refresh_token_secret_key_here_min_32_chars
   JWT_ACCESS_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

5. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": [...],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

```json
// Request
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!"
}

// Response (201)
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### Login
**POST** `/api/auth/login`

```json
// Request
{
  "email": "john@example.com",
  "password": "Password123!"
}

// Response (200)
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### Get Current User
**GET** `/api/auth/me`

Headers: `Authorization: Bearer <accessToken>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Refresh Token
**POST** `/api/auth/refresh`

```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response (200)
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### Logout
**POST** `/api/auth/logout`

```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response (200)
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Task Endpoints

All task endpoints require authentication: `Authorization: Bearer <accessToken>`

### Create Task
**POST** `/api/tasks`

```json
// Request
{
  "title": "Complete API documentation",
  "description": "Write comprehensive API docs",
  "priority": "high",
  "dueDate": "2024-01-20T18:00:00.000Z",
  "category": "64a1b2c3d4e5f67890123456",
  "tags": ["documentation", "backend"],
  "estimatedHours": 4
}

// Response (201)
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "64b1c2d3e4f5678901234567",
      "title": "Complete API documentation",
      "status": "todo",
      "priority": "high",
      "dueDate": "2024-01-20T18:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get All Tasks
**GET** `/api/tasks`

Query Parameters:
| Parameter | Description | Example |
|-----------|-------------|---------|
| status | Filter by status (comma-separated) | `todo,in-progress` |
| priority | Filter by priority | `high` |
| category | Filter by category ID | `64a1b2c3d4e5f67890123456` |
| search | Search in title/description | `api documentation` |
| dueDate[gte] | Due date from | `2024-01-01` |
| dueDate[lte] | Due date to | `2024-01-31` |
| page | Page number | `1` |
| limit | Items per page (max 100) | `10` |
| sortBy | Sort field:order | `dueDate:asc` |

```json
// Response (200)
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    },
    "stats": {
      "todo": 10,
      "inProgress": 5,
      "completed": 8,
      "archived": 2
    }
  }
}
```

### Get Single Task
**GET** `/api/tasks/:id`

### Update Task
**PUT** `/api/tasks/:id`

```json
// Request
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium"
}
```

### Delete Task
**DELETE** `/api/tasks/:id`

Response: `204 No Content`

### Update Task Status
**PUT** `/api/tasks/:id/status`

```json
// Request
{
  "status": "in-progress"
}

// Response (200)
{
  "success": true,
  "message": "Task status updated",
  "data": {
    "task": {
      "id": "64b1c2d3e4f5678901234567",
      "status": "in-progress",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

**Valid Status Values**: `todo`, `in-progress`, `completed`, `archived`

**Status Transition Rules**:
- From `todo`: Can transition to `in-progress`, `completed`, `archived`
- From `in-progress`: Can transition to `todo`, `completed`, `archived`
- From `completed`: Can transition to `todo`, `in-progress`, `archived`
- From `archived`: Cannot transition to any other status

### Update Task Priority
**PUT** `/api/tasks/:id/priority`

```json
// Request
{
  "priority": "high"
}
```

**Valid Priority Values**: `low`, `medium`, `high`

### Share Task
**POST** `/api/tasks/:id/share`

```json
// Request
{
  "userId": "507f1f77bcf86cd799439012"
}

// Response (200)
{
  "success": true,
  "message": "Task shared successfully",
  "data": {
    "task": { ... }
  }
}
```

### Get Shared Tasks
**GET** `/api/tasks/shared`

Returns tasks that have been shared with the current user.

---

## Category Endpoints

All category endpoints require authentication.

### Create Category
**POST** `/api/categories`

```json
// Request
{
  "name": "Work",
  "color": "#3B82F6"
}

// Response (201)
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": {
      "id": "64a1b2c3d4e5f67890123456",
      "name": "Work",
      "color": "#3B82F6",
      "taskCount": 0
    }
  }
}
```

### Get All Categories
**GET** `/api/categories`

### Update Category
**PUT** `/api/categories/:id`

### Delete Category
**DELETE** `/api/categories/:id`

Response: `204 No Content`

> **Note**: When a category is deleted, all tasks in that category will have their category set to `null`.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| BAD_REQUEST | 400 | Malformed request |
| INVALID_STATUS_TRANSITION | 400 | Invalid status change |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Not authorized for resource |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

---

## Validation Rules

### User Registration
- **Username**: 3-30 characters, alphanumeric and underscores only
- **Email**: Valid email format, unique
- **Password**: Minimum 6 characters, must contain at least one number

### Task
- **Title**: Required, max 200 characters
- **Description**: Optional, max 2000 characters
- **Due Date**: Must be in the future (for new tasks)
- **Priority**: `low`, `medium`, `high`
- **Status**: `todo`, `in-progress`, `completed`, `archived`

### Category
- **Name**: Required, max 50 characters
- **Color**: Valid hex color code (e.g., `#3B82F6`)

---

## Project Structure

```
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Global error handling
│   │   └── validate.js           # Validation wrapper
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Category.js
│   │   └── RefreshToken.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── categories.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   └── categoryController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── taskService.js
│   │   └── categoryService.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── taskValidator.js
│   │   └── categoryValidator.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── tokenUtils.js
│   └── app.js
├── tests/
│   ├── auth.test.js
│   ├── tasks.test.js
│   └── setup.js
├── .env.example
├── package.json
├── jest.config.js
├── postman_collection.json
└── README.md
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

The test suite uses an in-memory MongoDB instance for isolated testing.

---

## Postman Collection

Import `postman_collection.json` into Postman for pre-configured API requests with test scripts.

The collection includes:
- All API endpoints with example requests
- Environment variables for token management
- Automated test scripts for validation
- Error scenario examples

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production/test) | development |
| MONGODB_URI | MongoDB connection string | - |
| JWT_ACCESS_SECRET | Secret for access tokens | - |
| JWT_REFRESH_SECRET | Secret for refresh tokens | - |
| JWT_ACCESS_EXPIRES_IN | Access token expiry | 1h |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |

---

## License

ISC

