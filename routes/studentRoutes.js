/**
 * routes/studentRoutes.js – Student API routes
 */

const StudentController = require('../controllers/studentController');
const { requireAuth } = require('../middleware/authMiddleware');

module.exports = (app) => {
    // All student routes are protected
    app.get('/api/students', requireAuth, StudentController.getStudents);
    app.post('/api/students', requireAuth, StudentController.createStudent);
    app.put('/api/students/:id', requireAuth, StudentController.updateStudent);
    app.delete('/api/students/:id', requireAuth, StudentController.deleteStudent);
    // Get a student by its student_id (string) – we use a different path to avoid conflict with numeric id
    app.get('/api/students/by/:studentId', requireAuth, StudentController.getStudentById);
};