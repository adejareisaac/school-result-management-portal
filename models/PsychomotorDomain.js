/**
 * models/PsychomotorDomain.js – Psychomotor Domain model
 * Traits: handling_tools, drawing, handwriting, public_speaking, speech_fluency, sports
 * Rating: 1-5 scale
 */

const db = require('../config/database');

const PsychomotorDomain = {

    /**
     * Upsert psychomotor domain record
     */
    upsert(data) {
        const {
            student_id, session, term,
            handling_tools, drawing, handwriting,
            public_speaking, speech_fluency, sports
        } = data;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO psychomotor_domain 
                 (student_id, session, term, handling_tools, drawing, handwriting, 
                  public_speaking, speech_fluency, sports)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(student_id, session, term) DO UPDATE SET
                 handling_tools = excluded.handling_tools,
                 drawing = excluded.drawing,
                 handwriting = excluded.handwriting,
                 public_speaking = excluded.public_speaking,
                 speech_fluency = excluded.speech_fluency,
                 sports = excluded.sports`,
                [
                    student_id, session, term,
                    handling_tools || 0, drawing || 0, handwriting || 0,
                    public_speaking || 0, speech_fluency || 0, sports || 0
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Get psychomotor domain by student_id, session, term
     */
    findByStudentSessionTerm(studentId, session, term) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM psychomotor_domain WHERE student_id = ? AND session = ? AND term = ?',
                [studentId, session, term],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    /**
     * Delete psychomotor domain for a student
     */
    deleteByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM psychomotor_domain WHERE student_id = ?',
                [studentId],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

module.exports = PsychomotorDomain;