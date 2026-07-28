/**
 * models/Result.js – Result model (Cognitive Domain)
 * Now supports CA1, CA2, Exam, Total, Grade
 */

const db = require('../config/database');

// Grade mapping
const GRADE_MAP = {
    A: { min: 70, max: 100 },
    B: { min: 60, max: 69.9 },
    C: { min: 50, max: 59.9 },
    D: { min: 40, max: 49.9 },
    E: { min: 30, max: 39.9 },
    F: { min: 0, max: 29.9 }
};

function calculateGrade(percentage) {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    if (percentage >= 30) return 'E';
    return 'F';
}

const Result = {

    /**
     * Calculate total and grade from CA1, CA2, Exam
     */
calculateResult(ca1, ca2, exam) {
    let total = (ca1 || 0) + (ca2 || 0) + (exam || 0);
    if (total > 100) total = 100;
    const percentage = total; // because max is 100
    const grade = this.calculateGrade(percentage);
    return { total, percentage, grade };
},

    /**
     * Create a new result entry (auto-calculates total and grade)
     */
    create(data) {
        const { student_id, session, term, subject, ca1, ca2, exam, position, remark } = data;
    let total = (ca1 || 0) + (ca2 || 0) + (exam || 0);
    if (total > 100) total = 100; // clamp or throw? We'll clamp.
    const grade = this.calculateGrade(total); // since max 100, percentage = total
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO results (student_id, session, term, subject, ca1, ca2, exam, total, grade, position, remark)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [student_id, session, term, subject, ca1 || 0, ca2 || 0, exam || 0, total, grade, position || null, remark || null],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Get results with student names for a specific session/term
     * (Used for the student list view in results page)
     */
    getResultsWithStudents(session, term) {
        let sql = `
            SELECT r.*, s.name as student_name, s.class, s.student_id
            FROM results r
            JOIN students s ON r.student_id = s.student_id
        `;
        const params = [];
        if (session) {
            sql += ` WHERE r.session = ?`;
            params.push(session);
            if (term) {
                sql += ` AND r.term = ?`;
                params.push(term);
            }
        } else if (term) {
            sql += ` WHERE r.term = ?`;
            params.push(term);
        }
        sql += ` ORDER BY s.name ASC, r.subject ASC`;
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    /**
     * Get results for a student's full report card
     */
    findByStudentSessionTerm(studentId, session, term) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM results 
                 WHERE student_id = ? AND session = ? AND term = ?
                 ORDER BY subject ASC`,
                [studentId, session, term],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    },

    /**
     * Bulk upsert results for a student (full report card)
     * If result exists, update it; otherwise insert
     */
    bulkUpsert(studentId, session, term, subjects) {
        const queries = [];
        const values = [];

        for (const sub of subjects) {
            const { subject, ca1, ca2, exam, position, remark } = sub;
            const { total, grade } = this.calculateResult(ca1, ca2, exam);
            queries.push(`
                INSERT INTO results (student_id, session, term, subject, ca1, ca2, exam, total, grade, position, remark)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(student_id, session, term, subject) DO UPDATE SET
                ca1 = excluded.ca1,
                ca2 = excluded.ca2,
                exam = excluded.exam,
                total = excluded.total,
                grade = excluded.grade,
                position = excluded.position,
                remark = excluded.remark
            `);
            values.push([studentId, session, term, subject, ca1 || 0, ca2 || 0, exam || 0, total, grade, position || null, remark || null]);
        }

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                let error = null;
                for (let i = 0; i < queries.length; i++) {
                    db.run(queries[i], values[i], (err) => {
                        if (err) error = err;
                    });
                }
                db.run('COMMIT', (err) => {
                    if (err || error) reject(err || error);
                    else resolve();
                });
            });
        });
    },

    /**
     * Delete all results for a student (cascade)
     */
    deleteAllForStudent(studentId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM results WHERE student_id = ?',
                [studentId],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    /**
     * Find a single result by ID
     */
    findById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM results WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    /**
     * Update a result (used for individual edits)
     */
    update(id, data) {
        const { ca1, ca2, exam, position, remark } = data;
        const { total, grade } = this.calculateResult(ca1, ca2, exam);
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE results 
                 SET ca1 = ?, ca2 = ?, exam = ?, total = ?, grade = ?, position = ?, remark = ?
                 WHERE id = ?`,
                [ca1 || 0, ca2 || 0, exam || 0, total, grade, position || null, remark || null, id],
                function (err) {
                    if (err) reject(err);
                    if (this.changes === 0) reject(new Error(`Result with id ${id} not found`));
                    else resolve();
                }
            );
        });
    },

    /**
     * Delete a result by ID
     */
    delete(id) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM results WHERE id = ?',
                [id],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

module.exports = Result;