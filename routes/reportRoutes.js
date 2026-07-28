/**
 * routes/reportRoutes.js – Report card API routes
 */

const ReportController = require('../controllers/ReportController');
const { requireAuth } = require('../middleware/authMiddleware');

module.exports = (app) => {
    // All report routes are protected (teacher only)
    app.get('/api/report/:studentId', requireAuth, ReportController.getReport);
    app.put('/api/report/:studentId', requireAuth, ReportController.updateReport);
};