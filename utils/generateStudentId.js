/**
 * utils/generateStudentId.js – Student ID generation
 */

const Student = require('../models/Student');

/**
 * Generate a unique student ID for a given session.
 * Format: STD-YYYY-XXX (e.g., STD-2026-001)
 * @param {string} session – e.g., '2025/2026'
 * @returns {Promise<string>}
 */
async function generateStudentId(session) {
    // Extract the starting year (e.g., '2025' from '2025/2026')
    const year = session.split('/')[0];
    const prefix = `STD-${year}-`;

    // Get all existing students to find the highest sequence number for this year
    const allStudents = await Student.findAll();
    let maxSeq = 0;
    for (const s of allStudents) {
        if (s.student_id.startsWith(prefix)) {
            const seq = parseInt(s.student_id.split('-')[2], 10);
            if (seq > maxSeq) maxSeq = seq;
        }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
}

/**
 * Check if a given student ID is already in use.
 * @param {string} studentId
 * @returns {Promise<boolean>}
 */
async function isStudentIdTaken(studentId) {
    const existing = await Student.findByStudentId(studentId);
    return !!existing;
}

module.exports = {
    generateStudentId,
    isStudentIdTaken
};