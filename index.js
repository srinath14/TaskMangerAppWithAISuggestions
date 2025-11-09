const express = require('express');
const app = express();//express object
const env = require('dotenv');
const mongoose = require ('mongoose');
const bodyParser = require('body-parser');
const loginRoute = require('./routes/login');
const taskRoute = require('./routes/tasks');
const { requestLogger, errorLogger, logger } = require('./middleware/logger');
env.config();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// Request logging middleware
app.use(requestLogger);

// Serve static files (CSS, JS) from public directory
app.use('/static', express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager')
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
    });

// Routes
loginRoute(app);
taskRoute(app);

// Error handling middleware (must be last)
app.use(errorLogger);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(process.env.PORT || 3000, ()=>{
    logger.info(`Server started successfully on port ${process.env.PORT || 3000}`);
});


