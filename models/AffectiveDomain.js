/**
 * models/AffectiveDomain.js – Affective Domain model
 * Traits: attentiveness, honesty, neatness, politeness, punctuality,
 *         self_control, obedience, reliability, responsibility, relationships
 * Rating: 1-5 scale
 */

const db = require('../config/database');

const AffectiveDomain = {

    /**
     * Upsert affective domain record
     */
    upsert(data) {
        const {
            student_id, session, term,
            attentiveness, honesty, neatness, politeness, punctuality,
            self_control, obedience, reliability, responsibility, relationships
        } = data;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO affective_domain 
                 (student_id, session, term, attentiveness, honesty, neatness, politeness, 
                  punctuality, self_control, obedience, reliability, responsibility, relationships)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(student_id, session, term) DO UPDATE SET
                 attentiveness = excluded.attentiveness,
                 honesty = excluded.honesty,
                 neatness = excluded.neatness,
                 politeness = excluded.politeness,
                 punctuality = excluded.punctuality,
                 self_control = excluded.self_control,
                 obedience = excluded.obedience,
                 reliability = excluded.reliability,
                 responsibility = excluded.responsibility,
                 relationships = excluded.relationships`,
                [
                    student_id, session, term,
                    attentiveness || 0, honesty || 0, neatness || 0, politeness || 0,
                    punctuality || 0, self_control || 0, obedience || 0,
                    reliability || 0, responsibility || 0, relationships || 0
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Get affective domain by student_id, session, term
     */
    findByStudentSessionTerm(studentId, session, term) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM affective_domain WHERE student_id = ? AND session = ? AND term = ?',
                [studentId, session, term],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    /**
     * Delete affective domain for a student
     */
    deleteByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM affective_domain WHERE student_id = ?',
                [studentId],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

module.exports = AffectiveDomain;
