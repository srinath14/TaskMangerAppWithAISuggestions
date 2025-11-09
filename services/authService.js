const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Validate signup input
const validateSignupInput = (username, password) => {
    if (!username || !password) {
        return { valid: false, message: 'Username and password are required' };
    }
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
};

// Validate login input
const validateLoginInput = (username, password) => {
    if (!username || !password) {
        return { valid: false, message: 'Username and password are required' };
    }
    return { valid: true };
};

// Check if username already exists
const checkUsernameExists = async (username) => {
    const existingUser = await User.findOne({ username });
    return !!existingUser;
};

// Hash password
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Create new user
const createUser = async (username, hashedPassword, role = 'user') => {
    const newUser = new User({
        username,
        password: hashedPassword,
        role
    });
    await newUser.save();
    return {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role
    };
};

// Find user by username
const findUserByUsername = async (username) => {
    return await User.findOne({ username });
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Generate access token
const generateAccessToken = (userId, username, role) => {
    return jwt.sign(
        { 
            userId,
            username,
            role
        },
        JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );
};

// Generate refresh token
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// Save refresh token to database
const saveRefreshToken = async (token, userId) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const refreshToken = new RefreshToken({
        token,
        user: userId,
        expiresAt
    });
    await refreshToken.save();
    return refreshToken;
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
    const refreshToken = await RefreshToken.findOne({ token });
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
        return null;
    }
    return refreshToken;
};

// Delete refresh token
const deleteRefreshToken = async (token) => {
    await RefreshToken.deleteOne({ token });
};

// Delete all refresh tokens for a user
const deleteAllUserRefreshTokens = async (userId) => {
    await RefreshToken.deleteMany({ user: userId });
};

// Signup service
const signup = async (username, password) => {
    // Validate input
    const validation = validateSignupInput(username, password);
    if (!validation.valid) {
        throw { status: 400, message: validation.message };
    }

    // Check if user exists
    const userExists = await checkUsernameExists(username);
    if (userExists) {
        throw { status: 409, message: 'Username already exists' };
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await createUser(username, hashedPassword);

    return {
        user,
        message: 'User created successfully'
    };
};

// Login service
const login = async (username, password) => {
    // Validate input
    const validation = validateLoginInput(username, password);
    if (!validation.valid) {
        throw { status: 400, message: validation.message };
    }

    // Find user
    const user = await findUserByUsername(username);
    if (!user) {
        throw { status: 401, message: 'Invalid username or password' };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
        throw { status: 401, message: 'Invalid username or password' };
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.username, user.role);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(refreshToken, user._id);

    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            username: user.username,
            role: user.role
        },
        message: 'Logged in successfully'
    };
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
    const tokenDoc = await verifyRefreshToken(refreshToken);
    if (!tokenDoc) {
        throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    const user = await User.findById(tokenDoc.user);
    if (!user) {
        throw { status: 401, message: 'User not found' };
    }

    const accessToken = generateAccessToken(user._id, user.username, user.role);

    return {
        accessToken,
        user: {
            id: user._id,
            username: user.username,
            role: user.role
        }
    };
};

// Logout service
const logout = async (refreshToken) => {
    if (refreshToken) {
        await deleteRefreshToken(refreshToken);
    }
    return { message: 'Logged out successfully' };
};

// Logout from all devices
const logoutAll = async (userId) => {
    await deleteAllUserRefreshTokens(userId);
    return { message: 'Logged out from all devices successfully' };
};

module.exports = {
    signup,
    login,
    refreshAccessToken,
    logout,
    logoutAll
};

