/**
 * controllers/resultController.js – Result HTTP layer
 * Handles CRUD operations for results and student result viewing
 */

const ResultService = require('../services/resultService');

const ResultController = {

    /**
     * GET /api/results – Get results with optional filters (student_id, session, term)
     */
    async getResults(req, res) {
        try {
            const { student_id, session, term } = req.query;
            // We'll use the service's findAll method (from model) – but we don't have that in service.
            // We'll call the model directly here for simplicity, or add a method to service.
            // Actually, we have Result model's findAll – we can call it directly.
            const Result = require('../models/Result');
            const results = await Result.findAll({ student_id, session, term });
            res.json({ success: true, data: results });
        } catch (err) {
            console.error('Error fetching results:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    /**
     * POST /api/results – Upload a new result
     */
    async uploadResult(req, res) {
        try {
            const { student_id, session, term, subject, score, position, remark } = req.body;
            const result = await ResultService.uploadResult({
                student_id,
                session,
                term,
                subject,
                score,
                position,
                remark
            });
            res.status(201).json({ success: true, data: result });
        } catch (err) {
            console.error('Error uploading result:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    },

    /**
     * PUT /api/results/:id – Update a result
     */
    async updateResult(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const { subject, score, position, remark } = req.body;
            const result = await ResultService.updateResult(id, {
                subject,
                score,
                position,
                remark
            });
            res.json({ success: true, data: result });
        } catch (err) {
            console.error('Error updating result:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    },

    /**
     * DELETE /api/results/:id – Delete a result
     */
    async deleteResult(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            await ResultService.deleteResult(id);
            res.json({ success: true, message: 'Result deleted successfully.' });
        } catch (err) {
            console.error('Error deleting result:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    },

    /**
     * GET /api/student-result – Get student result sheet (for public viewing)
     * Query: ?studentId=STD-2026-001&session=2025/2026&term=First
     */
    async getStudentResultSheet(req, res) {
        try {
            const { studentId, session, term } = req.query;
            if (!studentId || !session || !term) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'studentId, session, and term are required.' 
                });
            }
            const data = await ResultService.getStudentResults(studentId, session, term);
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching student results:', err.message);
            res.status(404).json({ success: false, error: err.message });
        }
    }
};

module.exports = ResultController;