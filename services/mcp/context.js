/**
 * MCP Context Builders
 * Builds structured context for AI operations
 */

const mcp = require('./core');
const Task = require('../../models/Task');
const User = require('../../models/User');

/**
 * Build context for task-related operations
 */
async function buildTaskContext({ userId, taskId = null, includeHistory = true }) {
    const context = {
        user: null,
        currentTask: null,
        recentTasks: [],
        taskStats: {}
    };

    // Get user info
    const user = await User.findById(userId).select('username role');
    if (user) {
        context.user = {
            username: user.username,
            role: user.role
        };
    }

    // Get current task if specified
    if (taskId) {
        const task = await Task.findOne({ _id: taskId, user: userId });
        if (task) {
            context.currentTask = {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                category: task.category,
                project: task.project
            };
        }
    }

    // Get recent tasks for context
    if (includeHistory) {
        const recentTasks = await Task.find({ user: userId })
            .sort({ updatedAt: -1 })
            .limit(10)
            .select('title status priority dueDate category project completed');
        
        context.recentTasks = recentTasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            category: t.category,
            project: t.project,
            completed: t.completed
        }));
    }

    // Get task statistics
    const total = await Task.countDocuments({ user: userId });
    const completed = await Task.countDocuments({ user: userId, completed: true });
    const pending = await Task.countDocuments({ user: userId, completed: false });
    
    const now = new Date();
    const overdue = await Task.countDocuments({
        user: userId,
        completed: false,
        dueDate: { $lt: now, $ne: null }
    });

    context.taskStats = {
        total,
        completed,
        pending,
        overdue
    };

    return context;
}

/**
 * Build context for task summarization
 */
async function buildSummaryContext({ userId }) {
    const pendingTasks = await Task.find({
        user: userId,
        completed: false
    })
    .sort({ priority: -1, dueDate: 1 })
    .limit(50)
    .select('title description status priority dueDate category project');

    return {
        pendingTasks: pendingTasks.map(t => ({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            category: t.category,
            project: t.project
        })),
        count: pendingTasks.length
    };
}

/**
 * Build context for priority suggestion
 */
async function buildPriorityContext({ userId }) {
    const tasks = await Task.find({
        user: userId,
        completed: false
    })
    .sort({ dueDate: 1, priority: -1 })
    .limit(20)
    .select('title description status priority dueDate category project');

    return {
        tasks: tasks.map(t => ({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            category: t.category,
            project: t.project
        }))
    };
}

/**
 * Register context builders
 */
function registerContextBuilders() {
    mcp.registerContextBuilder('task', buildTaskContext);
    mcp.registerContextBuilder('summary', buildSummaryContext);
    mcp.registerContextBuilder('priority', buildPriorityContext);
}

// Auto-register on module load
registerContextBuilders();

module.exports = {
    buildTaskContext,
    buildSummaryContext,
    buildPriorityContext,
    registerContextBuilders
};

