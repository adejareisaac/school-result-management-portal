/**
 * authMiddleware.js – Protects routes from unauthenticated access
 */

// Main guard: redirects to login if no session exists
const requireAuth = (req, res, next) => {
    // Check if user session exists
    if (req.session && req.session.user) {
        // User is logged in – proceed
        return next();
    }

    // If it's an API or AJAX request, send 401 JSON
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ 
            error: 'Unauthorized – Please log in to access this resource.' 
        });
    }

    // Otherwise, redirect to the login page
    // Save the original URL so we can redirect back after login (optional)
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
};

// Helper to check if a user is logged in (without redirecting)
const isLoggedIn = (req) => {
    return req.session && req.session.user;
};

// Helper to get the current logged-in user (if any)
const getCurrentUser = (req) => {
    return req.session ? req.session.user : null;
};

module.exports = {
    requireAuth,
    isLoggedIn,
    getCurrentUser
};