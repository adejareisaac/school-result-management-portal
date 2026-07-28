/**
 * services/resultService.js – Result business logic
 * Handles validation, orchestration, and grade calculation (if needed)
 */

const Result = require('../models/Result');
const Student = require('../models/Student');
const constants = require('../config/constants');

const ResultService = {

    /**
     * Validate result data before saving
     * @param {Object} data - { student_id, session, term, subject, score, position, remark }
     * @throws {Error} - If validation fails
     */
    validateResultData(data) {
        const { student_id, session, term, subject, score, position, remark } = data;

        if (!student_id || student_id.trim() === '') {
            throw new Error('Student ID is required.');
        }

        if (!session || !constants.SESSIONS.includes(session)) {
            throw new Error(`Invalid session. Allowed: ${constants.SESSIONS.join(', ')}`);
        }

        if (!term || !constants.TERMS.includes(term)) {
            throw new Error(`Invalid term. Allowed: ${constants.TERMS.join(', ')}`);
        }

        if (!subject || subject.trim() === '') {
            throw new Error('Subject is required.');
        }

        if (score === undefined || score === null || isNaN(score)) {
            throw new Error('Score must be a number.');
        }
        const numScore = Number(score);
        if (numScore < constants.VALIDATION.MIN_SCORE || numScore > constants.VALIDATION.MAX_SCORE) {
            throw new Error(`Score must be between ${constants.VALIDATION.MIN_SCORE} and ${constants.VALIDATION.MAX_SCORE}.`);
        }

        // Position is optional, but if provided, it should be a string
        if (position && position.trim() === '') {
            throw new Error('Position cannot be empty if provided.');
        }

        // Remark is optional
    },

    /**
     * Check if a result already exists for the same student, session, term, and subject
     * (to prevent duplicates)
     * @param {string} studentId
     * @param {string} session
     * @param {string} term
     * @param {string} subject
     * @returns {Promise<boolean>}
     */
    async resultExists(studentId, session, term, subject) {
        const results = await Result.findByStudentSessionTerm(studentId, session, term);
        return results.some(r => r.subject === subject);
    },

    /**
     * Upload / Save a new result
     * @param {Object} data - { student_id, session, term, subject, score, position, remark }
     * @returns {Promise<Object>} - The saved result object
     */
    async uploadResult(data) {
        // Validate input
        this.validateResultData(data);

        // Check if student exists
        const student = await Student.findByStudentId(data.student_id);
        if (!student) {
            throw new Error(`Student with ID ${data.student_id} does not exist.`);
        }

        // Check for duplicate (same student, session, term, subject)
        const exists = await this.resultExists(data.student_id, data.session, data.term, data.subject);
        if (exists) {
            throw new Error(`Result for ${data.subject} already exists for this student, session, and term.`);
        }

        // Prepare data
        const resultData = {
            student_id: data.student_id,
            session: data.session,
            term: data.term,
            subject: data.subject.trim(),
            score: Number(data.score),
            position: data.position ? data.position.trim() : '',
            remark: data.remark ? data.remark.trim() : ''
        };

        // Save
        const id = await Result.create(resultData);
        const saved = await Result.findById(id);
        return saved;
    },

    /**
     * Fetch results for a student (for viewing result sheet)
     * @param {string} studentId
     * @param {string} session
     * @param {string} term
     * @returns {Promise<Object>} - { student, results }
     */
    async getStudentResults(studentId, session, term) {
        // Check student exists
        const student = await Student.findByStudentId(studentId);
        if (!student) {
            throw new Error(`Student with ID ${studentId} not found.`);
        }

        // Fetch results
        const results = await Result.findByStudentSessionTerm(studentId, session, term);

        // Optionally, calculate grade based on score (using constants)
        const gradedResults = results.map(r => {
            let grade = 'F';
            const score = r.score;
            if (score >= constants.RESULT_SHEET.GRADE_MARKS.A) grade = 'A';
            else if (score >= constants.RESULT_SHEET.GRADE_MARKS.B) grade = 'B';
            else if (score >= constants.RESULT_SHEET.GRADE_MARKS.C) grade = 'C';
            else if (score >= constants.RESULT_SHEET.GRADE_MARKS.D) grade = 'D';
            return { ...r, grade };
        });

        return {
            student: student,
            results: gradedResults
        };
    },

    /**
     * Update an existing result
     * @param {number} id - Result primary key
     * @param {Object} data - { subject, score, position, remark }
     * @returns {Promise<Object>} - Updated result
     */
    async updateResult(id, data) {
        // Validate subset of fields
        if (data.subject && data.subject.trim() === '') {
            throw new Error('Subject cannot be empty.');
        }
        if (data.score !== undefined && data.score !== null) {
            const numScore = Number(data.score);
            if (isNaN(numScore) || numScore < constants.VALIDATION.MIN_SCORE || numScore > constants.VALIDATION.MAX_SCORE) {
                throw new Error(`Score must be between ${constants.VALIDATION.MIN_SCORE} and ${constants.VALIDATION.MAX_SCORE}.`);
            }
        }

        // Check if result exists
        const existing = await Result.findById(id);
        if (!existing) {
            throw new Error(`Result with id ${id} not found.`);
        }

        // Prepare update data
        const updateData = {};
        if (data.subject) updateData.subject = data.subject.trim();
        if (data.score !== undefined) updateData.score = Number(data.score);
        if (data.position !== undefined) updateData.position = data.position.trim();
        if (data.remark !== undefined) updateData.remark = data.remark.trim();

        await Result.update(id, updateData);
        const updated = await Result.findById(id);
        return updated;
    },

    /**
     * Delete a result
     * @param {number} id - Result primary key
     * @returns {Promise<void>}
     */
    async deleteResult(id) {
        const existing = await Result.findById(id);
        if (!existing) {
            throw new Error(`Result with id ${id} not found.`);
        }
        await Result.delete(id);
    }
};

module.exports = ResultService;