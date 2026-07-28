/**
 * models/ReportRemark.js – Report Remarks model
 * Handles: teacher_remark, teacher_name, principal_remark, principal_name, next_term_date, report_date
 */

const db = require('../config/database');

const ReportRemark = {

    /**
     * Upsert report remark record
     */
    upsert(data) {
        const {
            student_id, session, term,
            teacher_remark, teacher_name,
            principal_remark, principal_name,
            next_term_date, report_date
        } = data;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO report_remarks 
                 (student_id, session, term, teacher_remark, teacher_name, 
                  principal_remark, principal_name, next_term_date, report_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(student_id, session, term) DO UPDATE SET
                 teacher_remark = COALESCE(excluded.teacher_remark, teacher_remark),
                 teacher_name = COALESCE(excluded.teacher_name, teacher_name),
                 principal_remark = COALESCE(excluded.principal_remark, principal_remark),
                 principal_name = COALESCE(excluded.principal_name, principal_name),
                 next_term_date = COALESCE(excluded.next_term_date, next_term_date),
                 report_date = COALESCE(excluded.report_date, report_date)`,
                [
                    student_id, session, term,
                    teacher_remark || null,
                    teacher_name || null,
                    principal_remark || null,
                    principal_name || null,
                    next_term_date || null,
                    report_date || new Date().toISOString().split('T')[0]
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Get report remarks by student_id, session, term
     */
    findByStudentSessionTerm(studentId, session, term) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM report_remarks WHERE student_id = ? AND session = ? AND term = ?',
                [studentId, session, term],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    /**
     * Delete report remarks for a student
     */
    deleteByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM report_remarks WHERE student_id = ?',
                [studentId],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

module.exports = ReportRemark;
