const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getStats, getSuggestions } = require('../controllers/dashboardController');
const { suggestSubtasks, summarizeTasks, suggestNextAction } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter, aiLimiter } = require('../middleware/rateLimiter');
const path = require('path');

const taskRoute = (app) => {
    // GET route to serve the tasks page
    app.get('/tasks', (req, res, next) => {
        // Check if user has token in localStorage (client-side check)
        // For server-side, we'll let the page load and let client-side JS handle redirect
        res.sendFile(path.join(__dirname, '../public/tasks.html'));
    });

    // Dashboard routes
    app.get('/api/tasks/stats', authenticateToken, apiLimiter, getStats);
    app.get('/api/tasks/suggestions', authenticateToken, aiLimiter, getSuggestions);

    // AI routes
    app.post('/api/ai/subtasks', authenticateToken, aiLimiter, suggestSubtasks);
    app.get('/api/ai/summarize', authenticateToken, aiLimiter, summarizeTasks);
    app.get('/api/ai/next-action', authenticateToken, aiLimiter, suggestNextAction);

    // API routes for tasks (all require authentication)
    app.get('/api/tasks', authenticateToken, apiLimiter, getTasks);
    app.get('/api/tasks/:id', authenticateToken, apiLimiter, getTask);
    app.post('/api/tasks', authenticateToken, apiLimiter, createTask);
    app.put('/api/tasks/:id', authenticateToken, apiLimiter, updateTask);
    app.delete('/api/tasks/:id', authenticateToken, apiLimiter, deleteTask);
}

module.exports = taskRoute;

