/**
 * controllers/resultController.js – Public result endpoint
 */

const ReportService = require('../services/ReportService');

const ResultController = {

    /**
     * GET /api/student-result – Public result lookup (read-only)
     * Query: ?studentId=STD-2025-001&session=2025/2026&term=First
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
            const report = await ReportService.getFullReport(studentId, session, term);
            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Error fetching student results:', error.message);
            res.status(404).json({ success: false, error: error.message });
        }
    }
};

module.exports = ResultController;