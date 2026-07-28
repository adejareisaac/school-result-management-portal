/**
 * models/Attendance.js – Attendance model
 */

const db = require('../config/database');

const Attendance = {

    /**
     * Upsert attendance record
     */
    upsert(data) {
        const { student_id, session, term, days_opened, days_present, days_absent } = data;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO attendance (student_id, session, term, days_opened, days_present, days_absent)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(student_id, session, term) DO UPDATE SET
                 days_opened = excluded.days_opened,
                 days_present = excluded.days_present,
                 days_absent = excluded.days_absent`,
                [student_id, session, term, days_opened, days_present, days_absent],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Get attendance by student_id, session, term
     */
    findByStudentSessionTerm(studentId, session, term) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM attendance WHERE student_id = ? AND session = ? AND term = ?',
                [studentId, session, term],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    /**
     * Delete attendance for a student
     */
    deleteByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM attendance WHERE student_id = ?',
                [studentId],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

module.exports = Attendance;