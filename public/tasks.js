// Get token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Get user info from localStorage
const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
};

// Check authentication and redirect if needed
const checkAuth = () => {
    const token = getToken();
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return true;
};

// Set up page
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    const userInfo = getUserInfo();
    if (userInfo) {
        document.getElementById('username').textContent = `Welcome, ${userInfo.username}`;
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    });

    // Load tasks
    loadTasks();

    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createTask();
    });
});

// Load all tasks
const loadTasks = async () => {
    try {
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            displayTasks(data.tasks);
        } else {
            showMessage('Failed to load tasks', 'error');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showMessage('Network error. Please try again.', 'error');
    }
};

// Display tasks
const displayTasks = (tasks) => {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');

    if (tasks.length === 0) {
        tasksList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tasksList.style.display = 'block';
    emptyState.style.display = 'none';

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task._id}">
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">Created: ${new Date(task.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-small ${task.completed ? 'btn-secondary' : 'btn-success'}" 
                        onclick="toggleTask('${task._id}', ${!task.completed})">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteTask('${task._id}')">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
};

// Create a new task
const createTask = async () => {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();

    if (!title) {
        showMessage('Task title is required', 'error');
        return;
    }

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ title, description })
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (data.success) {
            showMessage('Task created successfully!', 'success');
            document.getElementById('taskForm').reset();
            loadTasks();
        } else {
            showMessage(data.message || 'Failed to create task', 'error');
        }
    } catch (error) {
        console.error('Error creating task:', error);
        showMessage('Network error. Please try again.', 'error');
    }
};

// Toggle task completion
const toggleTask = async (taskId, completed) => {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ completed })
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (data.success) {
            loadTasks();
        } else {
            showMessage(data.message || 'Failed to update task', 'error');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showMessage('Network error. Please try again.', 'error');
    }
};

// Delete a task
const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (data.success) {
            showMessage('Task deleted successfully!', 'success');
            loadTasks();
        } else {
            showMessage(data.message || 'Failed to delete task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showMessage('Network error. Please try again.', 'error');
    }
};

// Show message
const showMessage = (message, type) => {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.tasks-container');
    container.insertBefore(messageDiv, container.firstChild);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
};

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

