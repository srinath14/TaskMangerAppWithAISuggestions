const { loginUser, signupUser, refreshToken, logoutUser, logoutAllUser } = require('../controllers/loginController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const path = require('path');

const loginRoute = (app)=>{
    
    // GET routes to serve the login/signup page
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    app.get('/signup', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    // POST routes for authentication (with rate limiting)
    app.post('/signup', authLimiter, signupUser);
    app.post('/login', authLimiter, loginUser);
    app.post('/refresh-token', authLimiter, refreshToken);
    app.post('/logout', logoutUser);
    app.post('/logout-all', authenticateToken, logoutAllUser);
}

module.exports = loginRoute;