/**
 * models/StudentProfile.js – Student extended profile
 * Handles: DOB, Age, Height, Weight, Club, Favourite Colour, Admission No
 */

const db = require('../config/database');

const StudentProfile = {

    /**
     * Create or update a student profile
     * @param {Object} data - { student_id, admission_no, dob, age, height, weight, club, fav_color }
     * @returns {Promise<number>} - The profile ID
     */
    upsert(data) {
        const { student_id, admission_no, dob, age, height, weight, club, fav_color } = data;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO student_profiles (student_id, admission_no, dob, age, height, weight, club, fav_color)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(student_id) DO UPDATE SET
                 admission_no = COALESCE(excluded.admission_no, admission_no),
                 dob = COALESCE(excluded.dob, dob),
                 age = COALESCE(excluded.age, age),
                 height = COALESCE(excluded.height, height),
                 weight = COALESCE(excluded.weight, weight),
                 club = COALESCE(excluded.club, club),
                 fav_color = COALESCE(excluded.fav_color, fav_color)`,
                [student_id, admission_no, dob, age, height, weight, club, fav_color],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Get profile by student_id
     * @param {string} studentId
     * @returns {Promise<Object|null>}
     */
    findByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM student_profiles WHERE student_id = ?',
                [studentId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    /**
     * Delete profile by student_id
     * @param {string} studentId
     * @returns {Promise<void>}
     */
    deleteByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM student_profiles WHERE student_id = ?',
                [studentId],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
};

module.exports = StudentProfile;