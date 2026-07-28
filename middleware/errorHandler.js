/**
 * errorHandler.js – Central error handling for the application
 */

const path = require('path');

// ---- 404 Handler (catch-all for routes that don't exist) ----
const notFound = (req, res, next) => {
    res.status(404);

    if (req.xhr || req.path.startsWith('/api/')) {
        return res.json({ 
            error: 'Not Found', 
            message: `The requested resource "${req.url}" does not exist.` 
        });
    }

    // Serve the custom 404 HTML page
    res.sendFile(path.join(__dirname, '../views/404.html'));
};

// ---- Global Error Handler (catches any thrown errors or next(err)) ----
const errorHandler = (err, req, res, next) => {
    // Log the full error stack for debugging
    console.error('🔥 Unhandled Error:', err.stack || err.message);

    const statusCode = err.status || 500;
    res.status(statusCode);

    if (req.xhr || req.path.startsWith('/api/')) {
        return res.json({
            error: err.name || 'Internal Server Error',
            message: err.message || 'Something went wrong on the server.'
        });
    }

    // Serve the custom 500 HTML page
    res.sendFile(path.join(__dirname, '../views/500.html'));
};

module.exports = {
    notFound,
    errorHandler
};