const { loginUser, signupUser } = require('../controllers/loginController');
const path = require('path');

const loginRoute = (app)=>{
    
    // GET routes to serve the login/signup page
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    app.get('/signup', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    // POST routes for authentication
    app.post('/signup', signupUser);
    app.post('/login', loginUser);
}

module.exports = loginRoute;