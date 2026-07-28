const session = require('express-session');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_please_change_in_production',
    resave: false,               // Prevents saving session if unmodified
    saveUninitialized: false,    // Prevents saving empty sessions
    cookie: {
        secure: false,           // Set to true if using HTTPS (for production on Render/Railway, enable it)
        httpOnly: true,          // Prevents client-side JS from accessing the cookie
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'srpm_sid'             // Custom cookie name (instead of default 'connect.sid')
};

// Export the configured session middleware
module.exports = session(sessionConfig);