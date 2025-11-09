/**
 * Model Context Protocol (MCP) Core
 * 
 * Provides a structured, model-agnostic interface for AI interactions.
 * Allows easy swapping between different LLM providers (OpenAI, Gemini, etc.)
 */

const crypto = require('crypto');

class MCPCore {
    constructor() {
        this.models = new Map();
        this.tools = new Map();
        this.contextBuilders = new Map();
    }

    /**
     * Register an AI model provider
     * @param {string} name - Model identifier (e.g., 'openai:gpt-4o-mini', 'gemini:gemini-pro')
     * @param {Object} config - Model configuration
     */
    registerModel(name, config) {
        this.models.set(name, {
            name,
            provider: config.provider, // 'openai', 'gemini', 'local'
            handler: config.handler, // Function to call the model
            defaultParams: config.defaultParams || {}
        });
    }

    /**
     * Register a tool that can be used by AI models
     * @param {string} name - Tool name
     * @param {Function} handler - Tool execution function
     * @param {string} description - Tool description for AI
     */
    registerTool(name, handler, description) {
        this.tools.set(name, {
            name,
            handler,
            description
        });
    }

    /**
     * Register a context builder
     * @param {string} name - Context builder name
     * @param {Function} builder - Function that builds context
     */
    registerContextBuilder(name, builder) {
        this.contextBuilders.set(name, builder);
    }

    /**
     * Build context using registered context builders
     * @param {string} contextType - Type of context to build
     * @param {Object} params - Parameters for context building
     */
    async buildContext(contextType, params) {
        const builder = this.contextBuilders.get(contextType);
        if (!builder) {
            throw new Error(`Context builder '${contextType}' not found`);
        }
        return await builder(params);
    }

    /**
     * Execute a tool
     * @param {string} toolName - Tool name
     * @param {Object} params - Tool parameters
     */
    async executeTool(toolName, params) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }
        return await tool.handler(params);
    }

    /**
     * Run an AI operation through MCP
     * @param {string} operation - Operation name (e.g., 'task_suggester', 'task_summarizer')
     * @param {Object} config - Operation configuration
     * @param {string} config.model - Model identifier
     * @param {string} config.instructions - System instructions
     * @param {Object} config.inputs - Input data
     * @param {string} config.contextType - Type of context to build
     * @param {Object} config.contextParams - Parameters for context building
     * @param {Array} config.availableTools - Tools available to the model
     */
    async run(operation, config) {
        const {
            model: modelName,
            instructions,
            inputs,
            contextType,
            contextParams = {},
            availableTools = [],
            responseFormat = 'json'
        } = config;

        // Get model configuration
        const model = this.models.get(modelName);
        if (!model) {
            throw new Error(`Model '${modelName}' not registered`);
        }

        // Build context if specified
        let context = {};
        if (contextType) {
            context = await this.buildContext(contextType, contextParams);
        }

        // Prepare tool descriptions for the model
        const toolDescriptions = availableTools.map(toolName => {
            const tool = this.tools.get(toolName);
            return tool ? { name: tool.name, description: tool.description } : null;
        }).filter(Boolean);

        // Build the prompt with context
        const prompt = this.buildPrompt({
            instructions,
            inputs,
            context,
            availableTools: toolDescriptions,
            responseFormat
        });

        // Call the model
        const response = await model.handler({
            prompt,
            model: modelName,
            ...model.defaultParams
        });

        // Parse and return response
        return this.parseResponse(response, responseFormat);
    }

    /**
     * Build a structured prompt
     */
    buildPrompt({ instructions, inputs, context, availableTools, responseFormat }) {
        let prompt = instructions + '\n\n';

        // Add context
        if (Object.keys(context).length > 0) {
            prompt += '## Context\n';
            prompt += JSON.stringify(context, null, 2) + '\n\n';
        }

        // Add inputs
        prompt += '## Input\n';
        prompt += JSON.stringify(inputs, null, 2) + '\n\n';

        // Add available tools
        if (availableTools.length > 0) {
            prompt += '## Available Tools\n';
            availableTools.forEach(tool => {
                prompt += `- ${tool.name}: ${tool.description}\n`;
            });
            prompt += '\n';
        }

        // Add response format instruction
        if (responseFormat === 'json') {
            prompt += '## Response Format\n';
            prompt += 'Return a valid JSON object.\n';
        }

        return prompt;
    }

    /**
     * Parse model response
     */
    parseResponse(response, format) {
        if (format === 'json') {
            try {
                // Try to extract JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return JSON.parse(response);
            } catch (error) {
                // If parsing fails, return as text
                return { text: response };
            }
        }
        return response;
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return Array.from(this.models.keys());
    }

    /**
     * Get available tools
     */
    getAvailableTools() {
        return Array.from(this.tools.keys()).map(name => {
            const tool = this.tools.get(name);
            return { name: tool.name, description: tool.description };
        });
    }
}

// Create singleton instance
const mcp = new MCPCore();

module.exports = mcp;

