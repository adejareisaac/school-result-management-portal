/**
 * services/studentService.js – Student business logic
 * Handles validation, ID generation, and orchestration
 */

const Student = require('../models/Student');
const constants = require('../config/constants');

const StudentService = {

    /**
     * Generate a unique student ID based on current session and sequence
     * Format: STD-YYYY-XXX (e.g., STD-2026-001)
     * @param {string} session - e.g., '2025/2026' (we'll extract the first year)
     * @returns {Promise<string>} - Generated student ID
     */
    async generateStudentId(session) {
        // Extract the starting year (e.g., '2025' from '2025/2026')
        const year = session.split('/')[0];
        
        // Get all existing students to find the latest sequence number
        const allStudents = await Student.findAll();
        const prefix = `STD-${year}-`;
        
        // Find the highest sequence number for this year
        let maxSeq = 0;
        for (const s of allStudents) {
            if (s.student_id.startsWith(prefix)) {
                const seq = parseInt(s.student_id.split('-')[2], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        }
        
        const nextSeq = String(maxSeq + 1).padStart(3, '0');
        return `${prefix}${nextSeq}`;
    },

    /**
     * Validate student data before saving
     * @param {Object} data - { student_id, name, gender, class, session }
     * @throws {Error} - If validation fails
     */
    validateStudentData(data) {
        const { name, gender, class: cls, session } = data;

        if (!name || name.trim().length < constants.VALIDATION.MIN_NAME_LENGTH) {
            throw new Error(`Name must be at least ${constants.VALIDATION.MIN_NAME_LENGTH} characters.`);
        }
        if (name.trim().length > constants.VALIDATION.MAX_NAME_LENGTH) {
            throw new Error(`Name cannot exceed ${constants.VALIDATION.MAX_NAME_LENGTH} characters.`);
        }

        if (!cls || cls.trim() === '') {
            throw new Error('Class is required.');
        }

        if (!session || session.trim() === '') {
            throw new Error('Academic session is required.');
        }

        if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
            throw new Error('Gender must be Male, Female, or Other.');
        }

        // Additional: check if session is valid (optional)
        if (!constants.SESSIONS.includes(session)) {
            throw new Error(`Invalid session. Allowed: ${constants.SESSIONS.join(', ')}`);
        }
    },

    /**
     * Create a new student (with ID generation if not provided)
     * @param {Object} data - { name, gender, class, session, student_id? }
     * @returns {Promise<Object>} - The created student object
     */
    async createStudent(data) {
        // Validate
        this.validateStudentData(data);

        let studentId = data.student_id;

        // If no student_id provided, generate one
        if (!studentId) {
            studentId = await this.generateStudentId(data.session);
        } else {
            // Check if provided ID already exists
            const exists = await Student.exists(studentId);
            if (exists) {
                throw new Error(`Student ID ${studentId} already exists.`);
            }
        }

        // Build the student object
        const studentData = {
            student_id: studentId,
            name: data.name.trim(),
            gender: data.gender || '',
            class: data.class.trim(),
            session: data.session.trim()
        };

        // Save to database
        const id = await Student.create(studentData);
        const created = await Student.findById(id);
        return created;
    },

    /**
     * Update an existing student
     * @param {number} id - Primary key
     * @param {Object} data - { name, gender, class, session }
     * @returns {Promise<Object>} - Updated student object
     */
    async updateStudent(id, data) {
        this.validateStudentData(data);

        // Check if student exists
        const existing = await Student.findById(id);
        if (!existing) {
            throw new Error(`Student with id ${id} not found.`);
        }

        await Student.update(id, {
            name: data.name.trim(),
            gender: data.gender || '',
            class: data.class.trim(),
            session: data.session.trim()
        });

        const updated = await Student.findById(id);
        return updated;
    },

    /**
     * Delete a student (and cascade delete results)
     * @param {number} id - Primary key
     * @returns {Promise<void>}
     */
    async deleteStudent(id) {
        const existing = await Student.findById(id);
        if (!existing) {
            throw new Error(`Student with id ${id} not found.`);
        }
        await Student.delete(id);
    },

    /**
     * Search students (with optional keyword)
     * @param {string} keyword - Search term for name or student_id
     * @returns {Promise<Array>} - List of students
     */
    async searchStudents(keyword = '') {
        return await Student.findAll(keyword);
    },

    /**
     * Get a single student by student_id (for result viewing)
     * @param {string} studentId
     * @returns {Promise<Object|null>}
     */
    async getStudentByStudentId(studentId) {
        return await Student.findByStudentId(studentId);
    }
};

module.exports = StudentService;