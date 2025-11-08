// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.form');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active form
        forms.forEach(form => form.classList.remove('active'));
        document.getElementById(`${targetTab}Form`).classList.add('active');
        
        // Clear messages
        document.getElementById('loginMessage').style.display = 'none';
        document.getElementById('signupMessage').style.display = 'none';
    });
});

// Login form handler
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageDiv = document.getElementById('loginMessage');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Disable button during request
    submitBtn.disabled = true;
    messageDiv.style.display = 'none';
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store JWT token and user info in localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userInfo', JSON.stringify(data.user));
            }
            
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Login successful!';
            messageDiv.style.display = 'block';
            
            // Redirect to tasks page after successful login
            setTimeout(() => {
                window.location.href = '/tasks';
            }, 1000);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message || 'Login failed. Please try again.';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Network error. Please check your connection.';
        messageDiv.style.display = 'block';
        console.error('Login error:', error);
    } finally {
        submitBtn.disabled = false;
    }
});

// Signup form handler
const signupForm = document.getElementById('signupForm');
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageDiv = document.getElementById('signupMessage');
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    
    // Disable button during request
    submitBtn.disabled = true;
    messageDiv.style.display = 'none';
    
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Account created successfully!';
            messageDiv.style.display = 'block';
            
            // Switch to login tab after successful signup
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = '';
            }, 1500);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message || 'Signup failed. Please try again.';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Network error. Please check your connection.';
        messageDiv.style.display = 'block';
        console.error('Signup error:', error);
    } finally {
        submitBtn.disabled = false;
    }
});

