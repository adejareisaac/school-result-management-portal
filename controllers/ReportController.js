/**
 * controllers/ReportController.js – Handles report card HTTP requests
 */

const ReportService = require('../services/ReportService');

const ReportController = {

    /**
     * GET /api/report/:studentId
     * Query parameters: session, term
     * Returns full report data for a student.
     */
    async getReport(req, res) {
        try {
            const { studentId } = req.params;
            const { session, term } = req.query;

            if (!session || !term) {
                return res.status(400).json({
                    success: false,
                    error: 'session and term are required query parameters.'
                });
            }

            const report = await ReportService.getFullReport(studentId, session, term);
            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Error fetching report:', error.message);
            res.status(404).json({ success: false, error: error.message });
        }
    },

    /**
     * PUT /api/report/:studentId
     * Body: { session, term, profile, results, attendance, affective, psychomotor, remarks }
     * Updates entire report card.
     */
    async updateReport(req, res) {
        try {
            const { studentId } = req.params;
            const { session, term, profile, results, attendance, affective, psychomotor, remarks } = req.body;

            if (!session || !term) {
                return res.status(400).json({
                    success: false,
                    error: 'session and term are required in the request body.'
                });
            }

            const updatedReport = await ReportService.updateFullReport(
                studentId,
                session,
                term,
                { profile, results, attendance, affective, psychomotor, remarks }
            );

            res.json({ success: true, data: updatedReport });
        } catch (error) {
            console.error('Error updating report:', error.message);
            res.status(400).json({ success: false, error: error.message });
        }
    }
};

module.exports = ReportController;