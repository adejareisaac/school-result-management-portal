/**
 * services/ReportService.js – Orchestrates full report card operations
 */

const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const AffectiveDomain = require('../models/AffectiveDomain');
const PsychomotorDomain = require('../models/PsychomotorDomain');
const ReportRemark = require('../models/ReportRemark');

const ReportService = {

    /**
     * Get full report data for a student for a specific session and term.
     * @param {string} studentId - The student's unique ID
     * @param {string} session - e.g., '2025/2026'
     * @param {string} term - e.g., 'First'
     * @returns {Promise<Object>} - Complete report card data
     */
    async getFullReport(studentId, session, term) {
        // 1. Get student with profile
        const student = await Student.findByStudentId(studentId);
        if (!student) {
            throw new Error(`Student with ID ${studentId} not found.`);
        }

        // 2. Get results (cognitive domain)
        const results = await Result.findByStudentSessionTerm(studentId, session, term);

        // 3. Get attendance
        const attendance = await Attendance.findByStudentSessionTerm(studentId, session, term) || {
            days_opened: 0,
            days_present: 0,
            days_absent: 0
        };

        // 4. Get affective domain
        const affective = await AffectiveDomain.findByStudentSessionTerm(studentId, session, term) || {};

        // 5. Get psychomotor domain
        const psychomotor = await PsychomotorDomain.findByStudentSessionTerm(studentId, session, term) || {};

        // 6. Get report remarks
        const remarks = await ReportRemark.findByStudentSessionTerm(studentId, session, term) || {};

        // 7. Calculate performance summary (if results exist)
        let summary = {
            totalObtained: 0,
            totalObtainable: 0,
            percentage: 0,
            grade: 'F'
        };

        if (results && results.length > 0) {
            const totalObtained = results.reduce((sum, r) => sum + (r.total || 0), 0);
            const maxTotal = 150; // each subject: CA1+CA2+Exam = 150 max
            const totalObtainable = results.length * maxTotal;
            const percentage = totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;
            const grade = this.calculateGrade(percentage);
            summary = { totalObtained, totalObtainable, percentage: Math.round(percentage * 10) / 10, grade };
        }

        // 8. Grade analysis (count per grade)
        const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
        results.forEach(r => {
            if (r.grade && gradeCounts.hasOwnProperty(r.grade)) {
                gradeCounts[r.grade]++;
            }
        });
        const totalSubjects = results.length;

        return {
            student,
            profile: student, // includes extra fields from join
            results,
            attendance,
            affective,
            psychomotor,
            remarks,
            summary,
            gradeAnalysis: gradeCounts,
            totalSubjects
        };
    },

    /**
     * Update an entire report card for a student.
     * This method updates student profile, results (bulk), attendance, affective, psychomotor, and remarks.
     * @param {string} studentId - The student's unique ID
     * @param {string} session - e.g., '2025/2026'
     * @param {string} term - e.g., 'First'
     * @param {Object} data - All report data (profile, results, attendance, affective, psychomotor, remarks)
     * @returns {Promise<Object>} - The updated full report
     */
    async updateFullReport(studentId, session, term, data) {
        const { profile, results, attendance, affective, psychomotor, remarks } = data;

        // 1. Update student profile
        if (profile) {
            await StudentProfile.upsert({
                student_id: studentId,
                admission_no: profile.admission_no,
                dob: profile.dob,
                age: profile.age,
                height: profile.height,
                weight: profile.weight,
                club: profile.club,
                fav_color: profile.fav_color
            });
        }

        // 2. Update results (bulk upsert)
        if (results && results.length > 0) {
            await Result.bulkUpsert(studentId, session, term, results);
        }

        // 3. Update attendance
        if (attendance) {
            await Attendance.upsert({
                student_id: studentId,
                session,
                term,
                days_opened: attendance.days_opened || 0,
                days_present: attendance.days_present || 0,
                days_absent: attendance.days_absent || 0
            });
        }

        // 4. Update affective domain
        if (affective) {
            await AffectiveDomain.upsert({
                student_id: studentId,
                session,
                term,
                attentiveness: affective.attentiveness || 0,
                honesty: affective.honesty || 0,
                neatness: affective.neatness || 0,
                politeness: affective.politeness || 0,
                punctuality: affective.punctuality || 0,
                self_control: affective.self_control || 0,
                obedience: affective.obedience || 0,
                reliability: affective.reliability || 0,
                responsibility: affective.responsibility || 0,
                relationships: affective.relationships || 0
            });
        }

        // 5. Update psychomotor domain
        if (psychomotor) {
            await PsychomotorDomain.upsert({
                student_id: studentId,
                session,
                term,
                handling_tools: psychomotor.handling_tools || 0,
                drawing: psychomotor.drawing || 0,
                handwriting: psychomotor.handwriting || 0,
                public_speaking: psychomotor.public_speaking || 0,
                speech_fluency: psychomotor.speech_fluency || 0,
                sports: psychomotor.sports || 0
            });
        }

        // 6. Update report remarks
        if (remarks) {
            await ReportRemark.upsert({
                student_id: studentId,
                session,
                term,
                teacher_remark: remarks.teacher_remark,
                teacher_name: remarks.teacher_name,
                principal_remark: remarks.principal_remark,
                principal_name: remarks.principal_name,
                next_term_date: remarks.next_term_date,
                report_date: remarks.report_date || new Date().toISOString().split('T')[0]
            });
        }

        // Return the updated full report
        return this.getFullReport(studentId, session, term);
    },

    /**
     * Calculate grade based on percentage.
     */
    calculateGrade(percentage) {
        if (percentage >= 70) return 'A';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        if (percentage >= 40) return 'D';
        if (percentage >= 30) return 'E';
        return 'F';
    }
};

module.exports = ReportService;