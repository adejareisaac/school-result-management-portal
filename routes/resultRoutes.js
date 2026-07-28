/**
 * routes/resultRoutes.js – Public result lookup only
 */

const ResultController = require('../controllers/resultController');

module.exports = (app) => {
    // Public route – no authentication needed
    app.get('/api/student-result', ResultController.getStudentResultSheet);
};