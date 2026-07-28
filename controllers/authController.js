/**
 * controllers/authController.js – Authentication HTTP layer
 * Handles login/logout requests
 */

const AuthService = require('../services/authService');

const AuthController = {

    /**
     * GET /login – Render login page (or redirect if already logged in)
     */
    showLoginPage(req, res) {
        if (req.session.user) {
            return res.redirect('/dashboard');
        }
        res.sendFile('login.html', { root: './views' });
    },

    /**
     * POST /login – Process login form
     */
// In controllers/authController.js
async login(req, res) {
    try {
        const { username, password } = req.body;
        // ... validation and service call ...

        const user = await AuthService.login(username, password);

        // Store user in session with login timestamp
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            loggedInAt: new Date().toISOString() // 👈 Add this line
        };

        const returnTo = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        res.redirect(returnTo);
    } catch (err) {
        // ... error handling ...
    }
},

    /**
     * POST /logout – Destroy session
     */
    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).send('Error logging out.');
            }
            res.redirect('/');
        });
    },

    /**
     * GET /dashboard – Protected dashboard (served by route, but we can render it)
     * (We'll handle this in routes directly for simplicity)
     */
};

module.exports = AuthController;