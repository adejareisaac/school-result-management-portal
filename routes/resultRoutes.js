/**
 * routes/resultRoutes.js – Result API routes
 */

const ResultController = require('../controllers/resultController');
const { requireAuth } = require('../middleware/authMiddleware');

module.exports = (app) => {
    // Public route – no authentication needed
    app.get('/api/student-result', ResultController.getStudentResultSheet);

    // Protected routes (teacher only)
    app.get('/api/results', requireAuth, ResultController.getResults);
    app.post('/api/results', requireAuth, ResultController.uploadResult);
    app.put('/api/results/:id', requireAuth, ResultController.updateResult);
    app.delete('/api/results/:id', requireAuth, ResultController.deleteResult);
};