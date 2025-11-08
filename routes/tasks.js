const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const path = require('path');

const taskRoute = (app) => {
    // GET route to serve the tasks page
    app.get('/tasks', (req, res, next) => {
        // Check if user has token in localStorage (client-side check)
        // For server-side, we'll let the page load and let client-side JS handle redirect
        res.sendFile(path.join(__dirname, '../public/tasks.html'));
    });

    // API routes for tasks (all require authentication)
    app.get('/api/tasks', authenticateToken, getTasks);
    app.get('/api/tasks/:id', authenticateToken, getTask);
    app.post('/api/tasks', authenticateToken, createTask);
    app.put('/api/tasks/:id', authenticateToken, updateTask);
    app.delete('/api/tasks/:id', authenticateToken, deleteTask);
}

module.exports = taskRoute;

