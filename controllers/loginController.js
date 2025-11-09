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
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
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

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const result = await authService.refreshAccessToken(refreshToken);
        return res.status(200).json({
            success: true,
            accessToken: result.accessToken,
            user: result.user
        });
    } catch (error) {
        const status = error.status || 401;
        const message = error.message || 'Invalid refresh token';
        
        console.error('Refresh token error:', error);
        return res.status(status).json({
            success: false,
            message: message
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.logout(refreshToken);

        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const logoutAllUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await authService.logoutAll(userId);

        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Logout all error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    signupUser,
    loginUser,
    refreshToken,
    logoutUser,
    logoutAllUser
};

