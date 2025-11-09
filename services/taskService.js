const Task = require('../models/Task');

// Validate task input
const validateTaskInput = (title) => {
    if (!title || title.trim() === '') {
        return { valid: false, message: 'Task title is required' };
    }
    return { valid: true };
};

// Build filter query
const buildFilterQuery = (userId, filters) => {
    const query = { user: userId };

    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.priority) {
        query.priority = filters.priority;
    }
    if (filters.category) {
        query.category = filters.category;
    }
    if (filters.project) {
        query.project = filters.project;
    }
    if (filters.completed !== undefined) {
        query.completed = filters.completed;
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
        query.dueDate = {};
        if (filters.dueDateFrom) {
            query.dueDate.$gte = new Date(filters.dueDateFrom);
        }
        if (filters.dueDateTo) {
            query.dueDate.$lte = new Date(filters.dueDateTo);
        }
    }

    return query;
};

// Get all tasks for a user with pagination and filters
const getUserTasks = async (userId, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
    } = options;

    const query = buildFilterQuery(userId, filters);
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    return {
        tasks,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Get task statistics for a user
const getTaskStats = async (userId) => {
    const total = await Task.countDocuments({ user: userId });
    const completed = await Task.countDocuments({ user: userId, completed: true });
    const pending = await Task.countDocuments({ user: userId, completed: false });
    
    const now = new Date();
    const overdue = await Task.countDocuments({
        user: userId,
        completed: false,
        dueDate: { $lt: now, $ne: null }
    });

    const byStatus = await Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byPriority = await Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    return {
        total,
        completed,
        pending,
        overdue,
        byStatus: byStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

// Get a single task by ID and user ID
const getTaskById = async (taskId, userId) => {
    return await Task.findOne({ 
        _id: taskId, 
        user: userId 
    });
};

// Create a new task
const createTask = async (taskData, userId) => {
    const { title, description, status, priority, dueDate, category, project, completed } = taskData;

    const validation = validateTaskInput(title);
    if (!validation.valid) {
        throw { status: 400, message: validation.message };
    }

    const task = new Task({
        title: title.trim(),
        description: description ? description.trim() : '',
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        category: category ? category.trim() : '',
        project: project ? project.trim() : '',
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
    if (updateData.status !== undefined) {
        task.status = updateData.status;
    }
    if (updateData.priority !== undefined) {
        task.priority = updateData.priority;
    }
    if (updateData.dueDate !== undefined) {
        task.dueDate = updateData.dueDate || null;
    }
    if (updateData.category !== undefined) {
        task.category = updateData.category.trim();
    }
    if (updateData.project !== undefined) {
        task.project = updateData.project.trim();
    }
    if (updateData.completed !== undefined) {
        task.completed = updateData.completed;
        // Auto-update status when completing
        if (updateData.completed && task.status !== 'completed') {
            task.status = 'completed';
        }
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
    getTaskStats,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};

