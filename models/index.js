/**
 * models/index.js – Export all models
 */

const User = require('./User');
const Student = require('./Student');
const StudentProfile = require('./StudentProfile');
const Result = require('./Result');
const Attendance = require('./Attendance');
const AffectiveDomain = require('./AffectiveDomain');
const PsychomotorDomain = require('./PsychomotorDomain');
const ReportRemark = require('./ReportRemark');

module.exports = {
    User,
    Student,
    StudentProfile,
    Result,
    Attendance,
    AffectiveDomain,
    PsychomotorDomain,
    ReportRemark
};