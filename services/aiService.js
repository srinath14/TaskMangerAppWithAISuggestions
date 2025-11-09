/**
 * AI Service - Refactored to use MCP (Model Context Protocol)
 * 
 * Uses MCP layer for structured, model-agnostic AI interactions
 */

const { mcp } = require('./mcp/index');

// Get configured model or use default
const getModel = () => {
    const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
    const availableModels = mcp.getAvailableModels();
    
    // Try to find a model from the preferred provider
    const preferredModel = availableModels.find(m => m.startsWith(AI_PROVIDER));
    if (preferredModel) {
        return preferredModel;
    }
    
    // Fallback to any available model
    if (availableModels.length > 0) {
        return availableModels.find(m => !m.startsWith('mock:')) || availableModels[0];
    }
    
    // Last resort: mock model
    return 'mock:default';
};

// Suggest subtasks based on task description
const suggestSubtasks = async (taskDescription, userId = null) => {
    if (!taskDescription || taskDescription.trim() === '') {
        return [];
    }

    try {
        const result = await mcp.run('task_suggester', {
            model: getModel(),
            instructions: `You are a task management assistant. Based on the task description, suggest 3-5 specific, actionable subtasks that would help complete this task. 
            
Return a JSON object with a "subtasks" array containing the subtask titles.`,
            inputs: {
                taskDescription: taskDescription.trim()
            },
            contextType: userId ? 'task' : null,
            contextParams: userId ? { userId, includeHistory: true } : {},
            availableTools: ['getTasks'], // Allow AI to see user's existing tasks for context
            responseFormat: 'json'
        });

        // Extract subtasks from response
        if (result.subtasks && Array.isArray(result.subtasks)) {
            return result.subtasks;
        }
        
        // Fallback parsing
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                return parsed.subtasks || [];
            } catch (e) {
                return [];
            }
        }
        
        return [];
    } catch (error) {
        console.error('AI service error (suggestSubtasks):', error);
        // Fallback to mock
        return getMockSubtasks(taskDescription);
    }
};

// Summarize all pending tasks
const summarizePendingTasks = async (tasks, userId = null) => {
    if (!tasks || tasks.length === 0) {
        return 'No pending tasks.';
    }

    try {
        const result = await mcp.run('task_summarizer', {
            model: getModel(),
            instructions: `You are a task management assistant. Summarize the user's pending tasks in a concise, actionable paragraph (2-3 sentences). 
            
Focus on:
- Overall task count and status
- High-priority items and deadlines
- Suggested focus areas

Return a JSON object with a "summary" field containing the text summary.`,
            inputs: {
                taskCount: tasks.length,
                tasks: tasks.map(t => ({
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate
                }))
            },
            contextType: userId ? 'summary' : null,
            contextParams: userId ? { userId } : {},
            responseFormat: 'json'
        });

        // Extract summary from response
        if (result.summary) {
            return result.summary;
        }
        
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                return parsed.summary || getMockSummary(tasks);
            } catch (e) {
                return result;
            }
        }
        
        return getMockSummary(tasks);
    } catch (error) {
        console.error('AI service error (summarizePendingTasks):', error);
        return getMockSummary(tasks);
    }
};

// Suggest priority or next action
const suggestPriority = async (tasks, userId = null) => {
    if (!tasks || tasks.length === 0) {
        return { message: 'No tasks to prioritize.' };
    }

    try {
        const result = await mcp.run('task_prioritizer', {
            model: getModel(),
            instructions: `You are a task management assistant. Analyze the user's tasks and suggest which one should be prioritized next.
            
Consider:
- Upcoming deadlines (earliest first)
- Current priority levels (urgent > high > medium > low)
- Task dependencies and context
- User's task history and patterns

Return a JSON object with:
- "taskTitle": The title of the recommended task
- "reason": A brief explanation (1-2 sentences) of why this task should be prioritized`,
            inputs: {
                tasks: tasks.map(t => ({
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    category: t.category,
                    project: t.project
                }))
            },
            contextType: userId ? 'priority' : null,
            contextParams: userId ? { userId } : {},
            availableTools: ['getTasks', 'updateTaskPriority'], // Allow AI to check tasks and update priorities
            responseFormat: 'json'
        });

        // Extract suggestion from response
        if (result.taskTitle && result.reason) {
            return {
                taskTitle: result.taskTitle,
                reason: result.reason
            };
        }
        
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                if (parsed.taskTitle && parsed.reason) {
                    return parsed;
                }
            } catch (e) {
                // Continue to fallback
            }
        }
        
        return getMockPrioritySuggestion(tasks);
    } catch (error) {
        console.error('AI service error (suggestPriority):', error);
        return getMockPrioritySuggestion(tasks);
    }
};

// Note: Direct API calls are now handled by MCP layer
// See services/mcp/models.js for model handlers

// Mock functions for when API is not configured
const getMockSubtasks = (description) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('marketing') || lowerDesc.includes('campaign')) {
        return ['Define target audience', 'Create ad budget', 'Design marketing materials', 'Schedule campaign launch'];
    }
    if (lowerDesc.includes('meeting') || lowerDesc.includes('presentation')) {
        return ['Prepare agenda', 'Create presentation slides', 'Send meeting invites', 'Prepare talking points'];
    }
    return ['Research and plan', 'Execute main task', 'Review and refine', 'Complete and document'];
};

const getMockSummary = (tasks) => {
    const urgentCount = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const withDueDate = tasks.filter(t => t.dueDate).length;
    
    return `You have ${tasks.length} pending tasks. ${urgentCount > 0 ? `${urgentCount} are high priority. ` : ''}${withDueDate > 0 ? `${withDueDate} have upcoming deadlines. ` : ''}Focus on completing high-priority items first.`;
};

const getMockPrioritySuggestion = (tasks) => {
    // Find task with earliest due date or highest priority
    const sorted = [...tasks].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const nextTask = sorted[0];
    return {
        taskTitle: nextTask.title,
        reason: nextTask.dueDate 
            ? `This task has the earliest deadline (${new Date(nextTask.dueDate).toLocaleDateString()})`
            : `This task has ${nextTask.priority} priority and should be addressed next`
    };
};

module.exports = {
    suggestSubtasks,
    summarizePendingTasks,
    suggestPriority
};

