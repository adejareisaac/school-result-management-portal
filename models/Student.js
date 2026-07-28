// models/Student.js
const db = require('../config/database');
const StudentProfile = require('./StudentProfile');

const Student = {

    create(data) {
        const { student_id, name, gender, class: cls, session } = data;
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO students (student_id, name, gender, class, session)
                 VALUES (?, ?, ?, ?, ?)`,
                [student_id, name, gender, cls, session],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                }
            );
        });
    },

    async createWithProfile(data) {
        const { name, gender, class: cls, session, student_id, profile } = data;
        const sid = student_id || await this.generateStudentId(session);
        const studentData = { student_id: sid, name, gender, class: cls, session };
        await this.create(studentData);
        if (profile) {
            await StudentProfile.upsert({ ...profile, student_id: sid });
        }
        return this.findByStudentId(sid);
    },

    findAllWithProfiles(searchTerm = '') {
        let sql = `SELECT s.*, p.dob, p.age, p.height, p.weight, p.club, p.fav_color
                   FROM students s
                   LEFT JOIN student_profiles p ON s.student_id = p.student_id`;
        const params = [];
        if (searchTerm && searchTerm.trim() !== '') {
            sql += ` WHERE s.name LIKE ? OR s.student_id LIKE ?`;
            const wildcard = `%${searchTerm.trim()}%`;
            params.push(wildcard, wildcard);
        }
        sql += ` ORDER BY s.name ASC`;
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    findAll(searchTerm = '') {
        let sql = 'SELECT * FROM students ORDER BY name ASC';
        const params = [];
        if (searchTerm && searchTerm.trim() !== '') {
            sql = `SELECT * FROM students 
                   WHERE name LIKE ? OR student_id LIKE ? 
                   ORDER BY name ASC`;
            const wildcard = `%${searchTerm.trim()}%`;
            params.push(wildcard, wildcard);
        }
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    findByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT s.*, p.dob, p.age, p.height, p.weight, p.club, p.fav_color
                 FROM students s
                 LEFT JOIN student_profiles p ON s.student_id = p.student_id
                 WHERE s.student_id = ?`,
                [studentId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    findById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT s.*, p.dob, p.age, p.height, p.weight, p.club, p.fav_color
                 FROM students s
                 LEFT JOIN student_profiles p ON s.student_id = p.student_id
                 WHERE s.id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    },

    async update(id, data) {
        const { name, gender, class: cls, session, profile } = data;
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE students 
                 SET name = ?, gender = ?, class = ?, session = ?
                 WHERE id = ?`,
                [name, gender, cls, session, id],
                function (err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error(`Student with id ${id} not found`));
                    }
                    resolve();
                }
            );
        });
        const student = await this.findById(id);
        if (student && profile) {
            await StudentProfile.upsert({ ...profile, student_id: student.student_id });
        }
        return this.findById(id);
    },

    async delete(id) {
        const student = await this.findById(id);
        if (!student) {
            throw new Error(`Student with id ${id} not found`);
        }
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM students WHERE id = ?',
                [id],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    exists(studentId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM students WHERE student_id = ?',
                [studentId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(!!row);
                }
            );
        });
    },

    async generateStudentId(session) {
        const year = session.split('/')[0];
        const prefix = `STD-${year}-`;
        const allStudents = await this.findAll();
        let maxSeq = 0;
        for (const s of allStudents) {
            if (s.student_id && s.student_id.startsWith(prefix)) {
                const parts = s.student_id.split('-');
                if (parts.length === 3) {
                    const seq = parseInt(parts[2], 10);
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            }
        }
        const nextSeq = String(maxSeq + 1).padStart(3, '0');
        return `${prefix}${nextSeq}`;
    }
};

module.exports = Student;