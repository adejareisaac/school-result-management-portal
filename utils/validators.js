/**
 * utils/validators.js – Backend validation helpers
 */

const constants = require('../config/constants');

/**
 * Validate a student's data (name, class, session, gender)
 * Throws errors with descriptive messages
 */
function validateStudentData(data) {
    const { name, gender, class: cls, session } = data;

    if (!name || typeof name !== 'string' || name.trim().length < constants.VALIDATION.MIN_NAME_LENGTH) {
        throw new Error(`Name must be at least ${constants.VALIDATION.MIN_NAME_LENGTH} characters.`);
    }
    if (name.trim().length > constants.VALIDATION.MAX_NAME_LENGTH) {
        throw new Error(`Name cannot exceed ${constants.VALIDATION.MAX_NAME_LENGTH} characters.`);
    }

    if (!cls || typeof cls !== 'string' || cls.trim() === '') {
        throw new Error('Class is required.');
    }

    if (!session || !constants.SESSIONS.includes(session)) {
        throw new Error(`Invalid session. Allowed: ${constants.SESSIONS.join(', ')}`);
    }

    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
        throw new Error('Gender must be Male, Female, or Other.');
    }

    return true;
}

/**
 * Validate result data (student_id, session, term, subject, score, position, remark)
 */
function validateResultData(data) {
    const { student_id, session, term, subject, score, position, remark } = data;

    if (!student_id || typeof student_id !== 'string' || student_id.trim() === '') {
        throw new Error('Student ID is required.');
    }

    if (!session || !constants.SESSIONS.includes(session)) {
        throw new Error(`Invalid session. Allowed: ${constants.SESSIONS.join(', ')}`);
    }

    if (!term || !constants.TERMS.includes(term)) {
        throw new Error(`Invalid term. Allowed: ${constants.TERMS.join(', ')}`);
    }

    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
        throw new Error('Subject is required.');
    }

    if (score === undefined || score === null || isNaN(score)) {
        throw new Error('Score must be a number.');
    }
    const numScore = Number(score);
    if (numScore < constants.VALIDATION.MIN_SCORE || numScore > constants.VALIDATION.MAX_SCORE) {
        throw new Error(`Score must be between ${constants.VALIDATION.MIN_SCORE} and ${constants.VALIDATION.MAX_SCORE}.`);
    }

    if (position && typeof position !== 'string') {
        throw new Error('Position must be a string.');
    }

    if (remark && typeof remark !== 'string') {
        throw new Error('Remark must be a string.');
    }

    return true;
}

/**
 * Validate login credentials (username, password)
 */
function validateLoginCredentials(data) {
    const { username, password } = data;
    if (!username || typeof username !== 'string' || username.trim() === '') {
        throw new Error('Username is required.');
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
        throw new Error('Password is required.');
    }
    return true;
}

/**
 * Check if a string is a valid email (simple)
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

module.exports = {
    validateStudentData,
    validateResultData,
    validateLoginCredentials,
    isValidEmail
};