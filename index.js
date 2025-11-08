const express = require('express');
const app = express();//express object
const env = require('dotenv');
const mongoose = require ('mongoose');
const bodyParser = require('body-parser');
const loginRoute = require('./routes/login');
const taskRoute = require('./routes/tasks');
env.config();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// Serve static files (CSS, JS) from public directory
app.use('/static', express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

loginRoute(app);
taskRoute(app);
app.listen(process.env.PORT, ()=>{
    console.log("server has started successfully");
});


