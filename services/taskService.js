const Task = require('../models/Task');

// Validate task input
const validateTaskInput = (title) => {
    if (!title || title.trim() === '') {
        return { valid: false, message: 'Task title is required' };
    }
    return { valid: true };
};

// Get all tasks for a user
const getUserTasks = async (userId) => {
    return await Task.find({ user: userId }).sort({ createdAt: -1 });
};

// Get a single task by ID and user ID
const getTaskById = async (taskId, userId) => {
    return await Task.findOne({ 
        _id: taskId, 
        user: userId 
    });
};

// Create a new task
const createTask = async (title, description, completed, userId) => {
    const validation = validateTaskInput(title);
    if (!validation.valid) {
        throw { status: 400, message: validation.message };
    }

    const task = new Task({
        title: title.trim(),
        description: description ? description.trim() : '',
        completed: completed || false,
        user: userId
    });

    await task.save();
    return task;
};

// Update a task
const updateTask = async (taskId, userId, updateData) => {
    const task = await getTaskById(taskId, userId);
    
    if (!task) {
        throw { status: 404, message: 'Task not found' };
    }

    if (updateData.title !== undefined) {
        task.title = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
        task.description = updateData.description.trim();
    }
    if (updateData.completed !== undefined) {
        task.completed = updateData.completed;
    }

    await task.save();
    return task;
};

// Delete a task
const deleteTask = async (taskId, userId) => {
    const task = await Task.findOneAndDelete({ 
        _id: taskId, 
        user: userId 
    });

    if (!task) {
        throw { status: 404, message: 'Task not found' };
    }

    return task;
};

module.exports = {
    getUserTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};

