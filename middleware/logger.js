/**
 * logger.js – Request logging middleware
 */

const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
    console.log(`[${timestamp}] ${req.method} ${req.url} – ${ip}`);

    // Optional: log request body for POST/PUT (be careful with passwords)
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        // Sanitize sensitive data (e.g., password) before logging
        const sanitized = { ...req.body };
        if (sanitized.password) sanitized.password = '***HIDDEN***';
        console.log(`   Body:`, sanitized);
    }

    next();
};

module.exports = logger;