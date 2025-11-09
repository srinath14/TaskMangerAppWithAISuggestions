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
        // Log request data
        console.log('🔵 Login Request:', {
            url: '/login',
            method: 'POST',
            data: { username, password: '***' } // Hide password in logs
        });
        
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        //console.log(response);
        // Log response status
        console.log('🟢 Response Status:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        const data = await response.json();
        console.log(data);
        // Log response data
        console.log('🟢 Response Data:', {
            success: data.success,
            message: data.message,
            hasAccessToken: !!data.accessToken,
            hasRefreshToken: !!data.refreshToken,
            user: data.user,
            fullResponse: data // Full response for debugging
        });
        
        if (response.ok && data.success) {
            // Store JWT tokens and user info in localStorage
            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                console.log('✅ Access token stored in localStorage');
            }
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
                console.log('✅ Refresh token stored in localStorage');
            }
            if (data.user) {
                localStorage.setItem('userInfo', JSON.stringify(data.user));
                console.log('✅ User info stored in localStorage:', data.user);
            }
            
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Login successful!';
            messageDiv.style.display = 'block';
            
            console.log('⏳ Redirecting to /tasks in 5 seconds... (check logs above)');
            
            // Redirect to tasks page after successful login (increased delay to see logs)
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message || 'Login failed. Please try again.';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        // Log error details
        console.error('🔴 Login Error:', {
            error: error.message,
            stack: error.stack,
            name: error.name
        });
        
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Network error. Please check your connection.';
        messageDiv.style.display = 'block';
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
        // Log request data
        console.log('🔵 Signup Request:', {
            url: '/signup',
            method: 'POST',
            data: { username, password: '***' } // Hide password in logs
        });
        
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        // Log response status
        console.log('🟢 Response Status:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        const data = await response.json();
        
        // Log response data
        console.log('🟢 Response Data:', {
            success: data.success,
            message: data.message,
            user: data.user
        });
        
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
        // Log error details
        console.error('🔴 Signup Error:', {
            error: error.message,
            stack: error.stack,
            name: error.name
        });
        
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Network error. Please check your connection.';
        messageDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
    }
});

