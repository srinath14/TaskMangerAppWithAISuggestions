const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
const createUser = async (username, hashedPassword) => {
    const newUser = new User({
        username,
        password: hashedPassword
    });
    await newUser.save();
    return {
        id: newUser._id,
        username: newUser.username
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

// Generate JWT token
const generateToken = (userId, username) => {
    return jwt.sign(
        { 
            userId,
            username
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
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

    // Generate token
    const token = generateToken(user._id, user.username);

    return {
        token,
        user: {
            id: user._id,
            username: user.username
        },
        message: 'Logged in successfully'
    };
};

module.exports = {
    signup,
    login
};

