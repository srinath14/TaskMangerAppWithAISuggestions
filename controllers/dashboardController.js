const taskService = require('../services/taskService');
const aiService = require('../services/aiService');

// Get task statistics
const getStats = async (req, res) => {
    try {
        const stats = await taskService.getTaskStats(req.user.userId);
        return res.status(200).json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

// Get AI-powered suggestions
const getSuggestions = async (req, res) => {
    try {
        // Get pending tasks
        const result = await taskService.getUserTasks(req.user.userId, {
            completed: false,
            limit: 50 // Get more tasks for better suggestions
        });

        const pendingTasks = result.tasks;

        // Get AI suggestions
        const summary = await aiService.summarizePendingTasks(pendingTasks);
        const prioritySuggestion = await aiService.suggestPriority(pendingTasks);

        return res.status(200).json({
            success: true,
            suggestions: {
                summary: summary,
                nextAction: prioritySuggestion,
                totalPending: pendingTasks.length
            }
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch suggestions'
        });
    }
};

module.exports = {
    getStats,
    getSuggestions
};

