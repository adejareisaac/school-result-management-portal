/**
 * Application-wide constants
 * Based on the PRD (School Result Management Portal)
 */

module.exports = {
    // App & School Info
    APP_NAME: 'School Result Management Portal',
    SCHOOL_NAME: 'Greenwood Academy',       // Change to your school's name
    SCHOOL_LOGO: '/images/logo.png',        // Path to logo

    // Academic Structure
    TERMS: ['First', 'Second', 'Third'],
    DEFAULT_SESSION: '2025/2026',
    SESSIONS: ['2023/2024', '2024/2025', '2025/2026', '2026/2027'],

    // User Roles (as per PRD)
    ROLES: {
        ADMIN: 'admin',
        TEACHER: 'teacher',
        // STUDENT: 'student' // Not needed since students don't authenticate
    },

    // Validation Rules
    VALIDATION: {
        MIN_SCORE: 0,
        MAX_SCORE: 100,
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100,
        STUDENT_ID_PREFIX: 'STD',
    },

    // Default Pagination
    PAGINATION: {
        ITEMS_PER_PAGE: 20,
    },

    // Result Sheet Settings
    RESULT_SHEET: {
        GRADE_MARKS: {
            'A': 70,
            'B': 60,
            'C': 50,
            'D': 40,
            'F': 0
        }
    }
};