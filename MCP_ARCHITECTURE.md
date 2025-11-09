# MCP (Model Context Protocol) Architecture

## 🧩 Overview

This task manager uses **MCP (Model Context Protocol)** as an architectural layer that abstracts AI model interactions, making the system modular, scalable, and model-agnostic.

## 🏗️ Architecture

```
Frontend / Client
       ↓
Node.js Backend (Express)
       ↓
🔹 MCP Layer (services/mcp/)
   ↳ Core: Model registration, tool management, context building
   ↳ Models: OpenAI, Gemini, Mock handlers
   ↳ Context: Task context builders
   ↳ Tools: getTasks, createTask, updateTaskPriority
       ↓
AI Service (services/aiService.js)
   ↳ Uses MCP for all AI operations
       ↓
LLM APIs (OpenAI / Gemini / Local)
```

## 📁 MCP Module Structure

```
services/mcp/
├── core.js          # MCP core engine
├── models.js        # Model handlers (OpenAI, Gemini, Mock)
├── context.js       # Context builders
├── tools.js         # AI-accessible tools
└── index.js         # Main entry point
```

## 🔧 Core Components

### 1. MCP Core (`core.js`)

The central orchestrator that:
- Registers and manages AI models
- Registers and executes tools
- Builds context for AI operations
- Routes requests to appropriate models
- Parses and structures responses

**Key Methods:**
- `registerModel(name, config)` - Register an AI model
- `registerTool(name, handler, description)` - Register a tool
- `registerContextBuilder(name, builder)` - Register context builder
- `run(operation, config)` - Execute an AI operation
- `buildContext(type, params)` - Build context
- `executeTool(name, params)` - Execute a tool

### 2. Models (`models.js`)

Handles communication with different AI providers:

**Registered Models:**
- `openai:gpt-4o` - OpenAI GPT-4o
- `openai:gpt-4o-mini` - OpenAI GPT-4o Mini
- `openai:gpt-3.5-turbo` - OpenAI GPT-3.5 Turbo
- `gemini:gemini-pro` - Google Gemini Pro
- `gemini:gemini-pro-vision` - Google Gemini Pro Vision
- `mock:default` - Mock model (fallback)

**Model Selection:**
- Checks `AI_PROVIDER` environment variable
- Falls back to available models
- Uses mock if no API keys configured

### 3. Context Builders (`context.js`)

Builds structured context for AI operations:

**Available Context Types:**
- `task` - Full task context (user, current task, recent tasks, stats)
- `summary` - Context for task summarization
- `priority` - Context for priority suggestions

**Context Includes:**
- User information
- Task history
- Task statistics
- Current task details

### 4. Tools (`tools.js`)

Tools that AI models can use to interact with the system:

**Available Tools:**
- `getTasks` - Retrieve user tasks with filters
- `createTask` - Create a new task
- `updateTaskPriority` - Update task priority

**Tool Execution:**
- Tools are executed server-side
- AI can request tool usage in prompts
- Tools provide structured data back to AI

## 🔄 How It Works

### Example: Suggest Subtasks

```javascript
// 1. AI Service calls MCP
const result = await mcp.run('task_suggester', {
    model: 'openai:gpt-4o-mini',
    instructions: 'Suggest 3-5 subtasks...',
    inputs: { taskDescription: 'Plan marketing campaign' },
    contextType: 'task',
    contextParams: { userId, includeHistory: true },
    availableTools: ['getTasks'],
    responseFormat: 'json'
});

// 2. MCP builds context
const context = await buildContext('task', { userId, includeHistory: true });
// Returns: { user, currentTask, recentTasks, taskStats }

// 3. MCP builds prompt
const prompt = buildPrompt({
    instructions,
    inputs,
    context,
    availableTools,
    responseFormat: 'json'
});

// 4. MCP calls model handler
const response = await openaiHandler({ prompt, model: 'gpt-4o-mini' });

// 5. MCP parses response
const parsed = parseResponse(response, 'json');
// Returns: { subtasks: ['Subtask 1', 'Subtask 2', ...] }
```

## 🎯 Benefits

### 1. Model Agnostic
```javascript
// Easy to switch models
model: 'openai:gpt-4o'      // OpenAI
model: 'gemini:gemini-pro'  // Gemini
model: 'mock:default'       // Mock (testing)
```

### 2. Structured Context
- AI always receives consistent, structured context
- Context includes user data, task history, statistics
- Makes AI responses more relevant and accurate

### 3. Extensible Tools
- Add new tools without changing AI service
- Tools can be used by AI models
- Tools provide structured data access

### 4. Easy Testing
- Mock model for development
- No API keys needed for testing
- Predictable responses

### 5. Scalable Architecture
- Add new models easily
- Add new context builders
- Add new tools
- All without changing core AI service

## 📊 MCP Operations

### Operation: `task_suggester`
- **Purpose**: Suggest subtasks for a task
- **Model**: Any available model
- **Context**: `task` (includes user tasks)
- **Tools**: `getTasks`
- **Response**: `{ subtasks: [...] }`

### Operation: `task_summarizer`
- **Purpose**: Summarize pending tasks
- **Model**: Any available model
- **Context**: `summary` (pending tasks)
- **Tools**: None
- **Response**: `{ summary: "..." }`

### Operation: `task_prioritizer`
- **Purpose**: Suggest next priority task
- **Model**: Any available model
- **Context**: `priority` (pending tasks)
- **Tools**: `getTasks`, `updateTaskPriority`
- **Response**: `{ taskTitle: "...", reason: "..." }`

## 🔐 Security & Control

### Context Control
- Only authorized data is included in context
- User-specific data is filtered by userId
- Sensitive information is excluded

### Tool Execution
- Tools require authentication
- Tools validate inputs
- Tools return structured data only

### Model Isolation
- Each model handler is isolated
- Errors in one model don't affect others
- Fallback to mock if real models fail

## 🚀 Usage Examples

### Using MCP Directly

```javascript
const { mcp } = require('./services/mcp');

// Run an operation
const result = await mcp.run('task_suggester', {
    model: 'openai:gpt-4o-mini',
    instructions: '...',
    inputs: { taskDescription: '...' },
    contextType: 'task',
    contextParams: { userId: '...' },
    availableTools: ['getTasks'],
    responseFormat: 'json'
});

// Build context manually
const context = await mcp.buildContext('task', { userId: '...' });

// Execute a tool
const tasks = await mcp.executeTool('getTasks', { userId: '...' });
```

### Adding a New Model

```javascript
// In services/mcp/models.js
mcp.registerModel('custom:my-model', {
    provider: 'custom',
    handler: async ({ prompt }) => {
        // Your custom model handler
        return await callCustomModel(prompt);
    },
    defaultParams: { temperature: 0.7 }
});
```

### Adding a New Tool

```javascript
// In services/mcp/tools.js
mcp.registerTool(
    'myTool',
    async (params) => {
        // Tool implementation
        return { result: '...' };
    },
    'Description of what this tool does'
);
```

### Adding a New Context Builder

```javascript
// In services/mcp/context.js
mcp.registerContextBuilder('myContext', async (params) => {
    // Build and return context
    return { data: '...' };
});
```

## 📝 Environment Variables

```env
AI_PROVIDER=openai          # Preferred provider
OPENAI_API_KEY=sk-...       # OpenAI API key
GEMINI_API_KEY=...          # Gemini API key
```

## 🎓 Resume Value

**"Integrated Model Context Protocol (MCP) layer to manage AI interactions, enabling task summarization and suggestion features using multiple LLM backends (OpenAI/Gemini)."**

This demonstrates:
- ✅ Deep understanding of AI architecture
- ✅ Ability to abstract complex systems
- ✅ Design of scalable, modular systems
- ✅ Model-agnostic design patterns
- ✅ Structured context management
- ✅ Tool-based AI interaction patterns

