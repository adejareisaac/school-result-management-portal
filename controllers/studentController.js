/**
 * controllers/studentController.js – Student HTTP layer
 * Handles CRUD operations for students with profiles
 */

const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const StudentService = require('../services/studentService');

const StudentController = {

    /**
     * GET /api/students – Get all students (with profiles)
     */
    async getStudents(req, res) {
        try {
            const { search } = req.query;
            const students = await Student.findAllWithProfiles(search || '');
            res.json({ success: true, data: students });
        } catch (err) {
            console.error('Error fetching students:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * POST /api/students – Create a new student with optional profile
     */
    async createStudent(req, res) {
        try {
            const { name, gender, class: cls, session, profile } = req.body;
            const student = await Student.createWithProfile({
                name,
                gender,
                class: cls,
                session,
                profile
            });
            res.status(201).json({ success: true, data: student });
        } catch (err) {
            console.error('Error creating student:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    },

    /**
     * PUT /api/students/:id – Update a student (including profile)
     */
    async updateStudent(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const { name, gender, class: cls, session, profile } = req.body;
            const student = await Student.update(id, {
                name,
                gender,
                class: cls,
                session,
                profile
            });
            res.json({ success: true, data: student });
        } catch (err) {
            console.error('Error updating student:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    },

    /**
     * DELETE /api/students/:id – Delete a student (cascade)
     */
    async deleteStudent(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            await Student.delete(id);
            res.json({ success: true, message: 'Student deleted successfully.' });
        } catch (err) {
            console.error('Error deleting student:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /api/students/by/:studentId – Get a single student by student_id
     */
    async getStudentById(req, res) {
        try {
            const { studentId } = req.params;
            const student = await Student.findByStudentId(studentId);
            if (!student) {
                return res.status(404).json({ success: false, error: 'Student not found.' });
            }
            res.json({ success: true, data: student });
        } catch (err) {
            console.error('Error fetching student:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = StudentController;