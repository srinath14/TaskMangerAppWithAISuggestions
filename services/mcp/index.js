/**
 * MCP (Model Context Protocol) Module
 * 
 * Main entry point for MCP functionality
 * Provides structured AI orchestration layer
 */

const mcp = require('./core');

// Import and auto-register models, context builders, and tools
require('./models');
require('./context');
require('./tools');

// Export MCP instance and utilities
module.exports = {
    mcp,
    // Convenience methods
    run: (operation, config) => mcp.run(operation, config),
    buildContext: (type, params) => mcp.buildContext(type, params),
    executeTool: (name, params) => mcp.executeTool(name, params),
    getAvailableModels: () => mcp.getAvailableModels(),
    getAvailableTools: () => mcp.getAvailableTools()
};

