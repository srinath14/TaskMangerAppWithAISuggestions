const aiService = require('../services/aiService');
const taskService = require('../services/taskService');

// Suggest subtasks for a task description
const suggestSubtasks = async (req, res) => {
    try {
        const { description } = req.body;
        const userId = req.user?.userId; // Get userId if authenticated
        
        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Task description is required'
            });
        }

        const subtasks = await aiService.suggestSubtasks(description, userId);
        
        return res.status(200).json({
            success: true,
            subtasks: subtasks
        });
    } catch (error) {
        console.error('Suggest subtasks error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate subtask suggestions'
        });
    }
};

// Summarize pending tasks
const summarizeTasks = async (req, res) => {
    try {
        const result = await taskService.getUserTasks(req.user.userId, {
            completed: false,
            limit: 100
        });

        const summary = await aiService.summarizePendingTasks(result.tasks, req.user.userId);
        
        return res.status(200).json({
            success: true,
            summary: summary,
            taskCount: result.tasks.length
        });
    } catch (error) {
        console.error('Summarize tasks error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate summary'
        });
    }
};

// Suggest priority/next action
const suggestNextAction = async (req, res) => {
    try {
        const result = await taskService.getUserTasks(req.user.userId, {
            completed: false,
            limit: 50
        });

        const suggestion = await aiService.suggestPriority(result.tasks, req.user.userId);
        
        return res.status(200).json({
            success: true,
            suggestion: suggestion
        });
    } catch (error) {
        console.error('Suggest next action error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate priority suggestion'
        });
    }
};

module.exports = {
    suggestSubtasks,
    summarizeTasks,
    suggestNextAction
};

