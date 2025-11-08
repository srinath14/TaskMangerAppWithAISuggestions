const authService = require('../services/authService');

const signupUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authService.signup(username, password);

        return res.status(201).json({
            success: true,
            message: result.message,
            user: result.user
        });
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        
        console.error('Signup error:', error);
        return res.status(status).json({
            success: false,
            message: message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);

        return res.status(200).json({
            success: true,
            message: result.message,
            token: result.token,
            user: result.user
        });
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        
        console.error('Login error:', error);
        return res.status(status).json({
            success: false,
            message: message
        });
    }
};

module.exports = {
    signupUser,
    loginUser
};

