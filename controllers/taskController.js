const taskService = require('../services/taskService');

// Get all tasks for the authenticated user
const getTasks = async (req, res) => {
    try {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            status: req.query.status,
            priority: req.query.priority,
            category: req.query.category,
            project: req.query.project,
            completed: req.query.completed !== undefined ? req.query.completed === 'true' : undefined,
            dueDateFrom: req.query.dueDateFrom,
            dueDateTo: req.query.dueDateTo
        };

        const result = await taskService.getUserTasks(req.user.userId, options);
        return res.status(200).json({
            success: true,
            tasks: result.tasks,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks'
        });
    }
};

// Get a single task by ID
const getTask = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id, req.user.userId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        return res.status(200).json({
            success: true,
            task: task
        });
    } catch (error) {
        console.error('Get task error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch task'
        });
    }
};

// Create a new task
const createTask = async (req, res) => {
    try {
        const taskData = req.body;
        const task = await taskService.createTask(taskData, req.user.userId);

        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: task
        });
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Failed to create task';
        
        console.error('Create task error:', error);
        return res.status(status).json({
            success: false,
            message: message
        });
    }
};

// Update a task
const updateTask = async (req, res) => {
    try {
        const { title, description, completed } = req.body;
        const updateData = { title, description, completed };
        
        const task = await taskService.updateTask(req.params.id, req.user.userId, updateData);

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task: task
        });
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Failed to update task';
        
        console.error('Update task error:', error);
        return res.status(status).json({
            success: false,
            message: message
        });
    }
};

// Delete a task
const deleteTask = async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id, req.user.userId);

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Failed to delete task';
        
        console.error('Delete task error:', error);
        return res.status(status).json({
            success: false,
            message: message
        });
    }
};

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask
};

