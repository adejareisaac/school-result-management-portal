/**
 * utils/helpers.js – General helper functions
 */

/**
 * Format a date object or string into a readable format (e.g., "10 Dec 2024")
 */
function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Get current date as ISO string (YYYY-MM-DD)
 */
function getISODate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Generate a random string (for temporary use)
 */
function randomString(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Truncate a string to a given length, adding ellipsis if needed
 */
function truncateString(str, maxLength = 50) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '…';
}

/**
 * Log a message with timestamp (for server-side logging)
 */
function logMessage(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

/**
 * Convert a grade letter (A, B, C, D, E, F) to a numeric range description
 */
function gradeDescription(grade) {
    const map = {
        'A': '70-100% – Excellent',
        'B': '60-69.9% – Very Good',
        'C': '50-59.9% – Good',
        'D': '40-49.9% – Pass',
        'E': '30-39.9% – Fair',
        'F': '0-29.9% – Weak'
    };
    return map[grade] || 'Unknown grade';
}

/**
 * Calculate grade based on percentage score
 */
function calculateGrade(percentage) {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    if (percentage >= 30) return 'E';
    return 'F';
}

/**
 * Pluralise a word based on count
 */
function pluralise(word, count, suffix = 's') {
    return count === 1 ? word : word + suffix;
}

module.exports = {
    formatDate,
    getISODate,
    randomString,
    truncateString,
    logMessage,
    gradeDescription,
    calculateGrade,
    pluralise
};