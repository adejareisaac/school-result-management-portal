/**
 * routes/authRoutes.js – Authentication routes
 */

const AuthController = require('../controllers/authController');

module.exports = (app) => {
    // Login form submission
    app.post('/login', AuthController.login);
    // Logout
    app.post('/logout', AuthController.logout);
};