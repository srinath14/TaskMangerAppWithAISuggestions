# Task Manager - Feature Documentation

## ✅ Implemented Features

### 1. Authentication System

#### Register, Login, Logout
- **POST `/signup`** - User registration
- **POST `/login`** - User login (returns access + refresh tokens)
- **POST `/logout`** - Logout (invalidates refresh token)
- **POST `/logout-all`** - Logout from all devices
- **POST `/refresh-token`** - Refresh access token using refresh token

#### JWT-based Authentication
- **Access Tokens**: Short-lived (15 minutes), used for API requests
- **Refresh Tokens**: Long-lived (7 days), stored in database, used to get new access tokens
- Tokens include user ID, username, and role
- Automatic token expiration and refresh mechanism

#### Password Security
- Bcrypt hashing with 10 salt rounds
- Minimum password length: 6 characters

#### Role-Based Access Control
- **Roles**: `user` (default), `admin`
- Middleware: `authenticateToken()` and `authorize(...roles)`
- User model includes role field

### 2. Task Management

#### Enhanced Task Model
- **Fields**:
  - `title` (required)
  - `description` (optional)
  - `status`: pending, in-progress, completed, cancelled
  - `priority`: low, medium, high, urgent
  - `dueDate` (optional Date)
  - `category` (optional string)
  - `project` (optional string)
  - `completed` (boolean)
  - `user` (reference to User)

#### CRUD Operations
- **GET `/api/tasks`** - Get all tasks with pagination and filters
- **GET `/api/tasks/:id`** - Get single task
- **POST `/api/tasks`** - Create new task
- **PUT `/api/tasks/:id`** - Update task
- **DELETE `/api/tasks/:id`** - Delete task

#### Pagination
- Query parameters: `page`, `limit`
- Response includes pagination metadata:
  ```json
  {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
  ```

#### Filtering
- Filter by: `status`, `priority`, `category`, `project`, `completed`
- Date range: `dueDateFrom`, `dueDateTo`
- Sorting: `sortBy`, `sortOrder` (asc/desc)

### 3. AI Integration

#### AI Service (`services/aiService.js`)
- Supports OpenAI and Gemini APIs
- Falls back to mock suggestions if API keys not configured
- Environment variables:
  - `OPENAI_API_KEY` or `GEMINI_API_KEY`
  - `AI_PROVIDER` ('openai' or 'gemini')

#### AI Endpoints
- **POST `/api/ai/subtasks`** - Suggest subtasks based on task description
  ```json
  {
    "description": "Plan marketing campaign"
  }
  ```
  Returns: `["Define target audience", "Create ad budget", ...]`

- **GET `/api/ai/summarize`** - Summarize all pending tasks
  Returns: Text summary of pending tasks

- **GET `/api/ai/next-action`** - Suggest next priority task
  Returns: `{ "taskTitle": "...", "reason": "..." }`

### 4. User Dashboard

#### Statistics Endpoint
- **GET `/api/tasks/stats`**
  Returns:
  ```json
  {
    "stats": {
      "total": 50,
      "completed": 30,
      "pending": 20,
      "overdue": 5,
      "byStatus": { "pending": 15, "in-progress": 5, ... },
      "byPriority": { "high": 10, "medium": 8, ... }
    }
  }
  ```

#### Suggestions Endpoint
- **GET `/api/tasks/suggestions`**
  Returns AI-powered insights:
  ```json
  {
    "suggestions": {
      "summary": "You have 20 pending tasks...",
      "nextAction": { "taskTitle": "...", "reason": "..." },
      "totalPending": 20
    }
  }
  ```

### 5. Security & Infrastructure

#### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **AI Endpoints**: 20 requests per hour
- Uses `express-rate-limit`

#### Logging
- Winston logger with multiple transports
- Logs to console, `logs/combined.log`, and `logs/error.log`
- Request logging middleware
- Error logging middleware
- Log levels: info, warn, error

#### Error Handling
- Centralized error handling
- Proper HTTP status codes
- Error logging

### 6. API Structure

All API endpoints follow RESTful conventions:
- Authentication required (except `/login`, `/signup`)
- Bearer token in `Authorization` header
- Consistent JSON response format:
  ```json
  {
    "success": true/false,
    "message": "...",
    "data": {...}
  }
  ```

## 📋 Environment Variables

Create a `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
# OR
GEMINI_API_KEY=your-gemini-api-key
LOG_LEVEL=info
```

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (`.env` file)

3. Start MongoDB

4. Run the server:
   ```bash
   npm start
   # or
   node index.js
   ```

5. Access:
   - Login/Signup: `http://localhost:3000/login`
   - Tasks: `http://localhost:3000/tasks`

## 📝 Optional Features (Not Yet Implemented)

### Email Notifications
- Would require `nodemailer` package
- Send emails on task creation, completion, overdue
- Email templates for different events

### Webhooks
- Would require webhook configuration model
- Send HTTP POST requests when task status changes
- Configurable webhook URLs per user

## 🔧 API Usage Examples

### Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"password123"}'
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the task manager",
    "priority": "high",
    "status": "in-progress",
    "dueDate": "2024-12-31",
    "category": "Development",
    "project": "Task Manager"
  }'
```

### Get Tasks with Filters
```bash
curl "http://localhost:3000/api/tasks?status=pending&priority=high&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Statistics
```bash
curl http://localhost:3000/api/tasks/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### AI Subtask Suggestions
```bash
curl -X POST http://localhost:3000/api/ai/subtasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Plan marketing campaign"}'
```

## 📁 Project Structure

```
task-manager/
├── controllers/       # Request handlers
│   ├── loginController.js
│   ├── taskController.js
│   ├── dashboardController.js
│   └── aiController.js
├── services/         # Business logic
│   ├── authService.js
│   ├── taskService.js
│   └── aiService.js
├── models/           # Database models
│   ├── User.js
│   ├── Task.js
│   └── RefreshToken.js
├── middleware/       # Middleware functions
│   ├── auth.js
│   ├── rateLimiter.js
│   └── logger.js
├── routes/           # Route definitions
│   ├── login.js
│   └── tasks.js
├── public/           # Frontend files
│   ├── index.html
│   ├── tasks.html
│   └── ...
└── logs/             # Log files
```

## 🔐 Security Best Practices

1. **JWT Tokens**: Short-lived access tokens, long-lived refresh tokens
2. **Password Hashing**: Bcrypt with salt rounds
3. **Rate Limiting**: Prevents brute force attacks
4. **Role-Based Access**: Admin/user separation
5. **Input Validation**: All inputs validated
6. **Error Handling**: No sensitive info in error messages
7. **Logging**: Comprehensive request/error logging

## 📊 Database Schema

### User
- `username` (unique)
- `password` (hashed)
- `role` (user/admin)
- `timestamps`

### Task
- `title`
- `description`
- `status` (enum)
- `priority` (enum)
- `dueDate`
- `category`
- `project`
- `completed`
- `user` (reference)
- `timestamps`

### RefreshToken
- `token` (unique)
- `user` (reference)
- `expiresAt`
- `timestamps` (auto-delete expired)

