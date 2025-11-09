/**
 * MCP Tools
 * Tools that AI models can use to interact with the system
 */

const mcp = require('./core');
const Task = require('../../models/Task');

/**
 * Tool: Get user tasks
 */
async function getTasksTool({ userId, filters = {} }) {
    const query = { user: userId, ...filters };
    const tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .select('title description status priority dueDate category project completed');
    
    return {
        tasks: tasks.map(t => ({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            category: t.category,
            project: t.project,
            completed: t.completed
        })),
        count: tasks.length
    };
}

/**
 * Tool: Create a task
 */
async function createTaskTool({ userId, taskData }) {
    const task = new Task({
        ...taskData,
        user: userId
    });
    await task.save();
    
    return {
        success: true,
        task: {
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority
        }
    };
}

/**
 * Tool: Update task priority
 */
async function updateTaskPriorityTool({ userId, taskId, priority }) {
    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
        return { success: false, error: 'Task not found' };
    }
    
    task.priority = priority;
    await task.save();
    
    return {
        success: true,
        task: {
            id: task._id,
            title: task.title,
            priority: task.priority
        }
    };
}

/**
 * Register all tools
 */
function registerTools() {
    mcp.registerTool(
        'getTasks',
        getTasksTool,
        'Retrieve user tasks with optional filters (status, priority, category, project)'
    );
    
    mcp.registerTool(
        'createTask',
        createTaskTool,
        'Create a new task with title, description, status, priority, dueDate, category, and project'
    );
    
    mcp.registerTool(
        'updateTaskPriority',
        updateTaskPriorityTool,
        'Update the priority of a specific task (low, medium, high, urgent)'
    );
}

// Auto-register on module load
registerTools();

module.exports = {
    getTasksTool,
    createTaskTool,
    updateTaskPriorityTool,
    registerTools
};

