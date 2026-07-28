// database/init.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/database');

const SALT_ROUNDS = 10;

// ---------- Helpers ----------
function runSqlStatements(sql) {
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '').map(stmt => stmt.trim() + ';');
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            for (const stmt of statements) {
                db.run(stmt, (err) => {
                    if (err && !err.message.includes('already exists')) {
                        return reject(err);
                    }
                });
            }
            resolve();
        });
    });
}

function insert(table, data) {
    const cols = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`;
    return new Promise((resolve, reject) => {
        db.run(sql, values, function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function tableExists(tableName) {
    return new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [tableName], (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
        });
    });
}

function getCount(tableName) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });
}

async function generateStudentId(session) {
    const year = session.split('/')[0];
    const prefix = `STD-${year}-`;
    const rows = await new Promise((resolve, reject) => {
        db.all('SELECT student_id FROM students', (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
    let maxSeq = 0;
    for (const s of rows) {
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

function getOrdinal(n) {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
}

function calculateGrade(percentage) {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    if (percentage >= 30) return 'E';
    return 'F';
}

// ---------- Main ----------
async function initDatabase() {
    try {
        console.log('🔄 Initializing database...');

        // 1. Run schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Creating tables...');
        await runSqlStatements(schemaSQL);
        console.log('✅ Tables created.');

        // 2. Admin user
        const userCount = await getCount('users');
        if (userCount === 0) {
            console.log('👤 Creating default admin...');
            const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
            await insert('users', { username: 'admin', password_hash: hashedPassword, role: 'admin' });
            console.log('✅ Admin created (username: admin, password: password123)');
        } else {
            console.log(`ℹ️ Admin already exists (${userCount} users).`);
        }

        // 3. Seed students with profiles
        const studentCount = await getCount('students');
        if (studentCount === 0) {
            console.log('📚 Seeding sample students...');

            const studentsData = [
                {
                    name: 'Adeleke, Folashade Esther',
                    gender: 'Female',
                    class: 'SS2',
                    session: '2025/2026',
                    profile: {
                        dob: '12-Aug-2004',
                        age: '14yrs',
                        height: '76.0',
                        weight: '48.0',
                        club: 'Cultural Dance, Choir',
                        fav_color: 'Lilac'
                    }
                },
                {
                    name: 'Alice Johnson',
                    gender: 'Female',
                    class: 'SS3',
                    session: '2025/2026',
                    profile: {
                        dob: '15-Mar-2005',
                        age: '14yrs',
                        height: '72.0',
                        weight: '50.0',
                        club: 'Debate Club',
                        fav_color: 'Blue'
                    }
                },
                {
                    name: 'Brian Smith',
                    gender: 'Male',
                    class: 'SS3',
                    session: '2025/2026',
                    profile: {
                        dob: '20-Jun-2004',
                        age: '15yrs',
                        height: '80.0',
                        weight: '62.0',
                        club: 'Football',
                        fav_color: 'Red'
                    }
                },
                {
                    name: 'Catherine Okafor',
                    gender: 'Female',
                    class: 'SS2',
                    session: '2025/2026',
                    profile: {
                        dob: '10-Sep-2005',
                        age: '13yrs',
                        height: '68.0',
                        weight: '45.0',
                        club: 'Choir',
                        fav_color: 'Pink'
                    }
                },
                {
                    name: 'David Musa',
                    gender: 'Male',
                    class: 'SS1',
                    session: '2025/2026',
                    profile: {
                        dob: '05-Jan-2006',
                        age: '13yrs',
                        height: '74.0',
                        weight: '52.0',
                        club: 'Chess Club',
                        fav_color: 'Green'
                    }
                },
                {
                    name: 'Eunice Adeyemi',
                    gender: 'Female',
                    class: 'SS3',
                    session: '2024/2025',
                    profile: {
                        dob: '22-Nov-2003',
                        age: '15yrs',
                        height: '70.0',
                        weight: '47.0',
                        club: 'Literary Club',
                        fav_color: 'Purple'
                    }
                }
            ];

            const insertedStudents = [];
            for (const s of studentsData) {
                const student_id = await generateStudentId(s.session);
                await insert('students', {
                    student_id,
                    name: s.name,
                    gender: s.gender,
                    class: s.class,
                    session: s.session
                });
                if (s.profile) {
                    await insert('student_profiles', {
                        student_id,
                        dob: s.profile.dob,
                        age: s.profile.age,
                        height: s.profile.height,
                        weight: s.profile.weight,
                        club: s.profile.club,
                        fav_color: s.profile.fav_color
                    });
                }
                insertedStudents.push({ ...s, student_id });
                console.log(`   ✅ ${student_id} – ${s.name}`);
            }

            // 4. Seed results, attendance, affective, psychomotor, remarks
            console.log('📝 Seeding full report data...');

            const subjects = [
                'Agricultural Science', 'Biology', 'Chemistry', 'Civic Education',
                'Computer/Data Processing', 'Economics', 'English Language',
                'Further Mathematics', 'Geography', 'Mathematics',
                'Phonetics/Oral English', 'Physics', 'Technical Drawing', 'Yoruba Language'
            ];

            const terms = ['First', 'Second', 'Third'];
            const remarksList = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];

            for (const student of insertedStudents) {
                for (const term of terms) {
                    // --- Results (all 14 subjects) with total ≤ 100 ---
                    for (const subject of subjects) {
                        // Generate CA1, CA2, Exam such that sum ≤ 100
                        const ca1 = Math.floor(Math.random() * 20) + 10; // 10-30
                        const ca2 = Math.floor(Math.random() * 20) + 10; // 10-30
                        let exam = Math.floor(Math.random() * 40) + 20; // 20-60
                        let total = ca1 + ca2 + exam;
                        if (total > 100) {
                            exam = 100 - ca1 - ca2;
                            if (exam < 0) exam = 0;
                            total = ca1 + ca2 + exam;
                        }
                        const percentage = total; // since max is 100
                        const grade = calculateGrade(percentage);
                        const position = Math.floor(Math.random() * 5) + 1;
                        const remark = remarksList[Math.floor(Math.random() * remarksList.length)];
                        await insert('results', {
                            student_id: student.student_id,
                            session: student.session,
                            term,
                            subject,
                            ca1,
                            ca2,
                            exam,
                            total,
                            grade,
                            position: `${position}${getOrdinal(position)}`,
                            remark
                        });
                    }

                    // --- Attendance ---
                    const daysOpened = 150;
                    const daysPresent = Math.floor(Math.random() * 20) + 130; // 130-150
                    const daysAbsent = daysOpened - daysPresent;
                    await insert('attendance', {
                        student_id: student.student_id,
                        session: student.session,
                        term,
                        days_opened: daysOpened,
                        days_present: daysPresent,
                        days_absent: daysAbsent
                    });

                    // --- Affective Domain ---
                    const affectiveTraits = {
                        attentiveness: Math.floor(Math.random() * 5) + 1,
                        honesty: Math.floor(Math.random() * 5) + 1,
                        neatness: Math.floor(Math.random() * 5) + 1,
                        politeness: Math.floor(Math.random() * 5) + 1,
                        punctuality: Math.floor(Math.random() * 5) + 1,
                        self_control: Math.floor(Math.random() * 5) + 1,
                        obedience: Math.floor(Math.random() * 5) + 1,
                        reliability: Math.floor(Math.random() * 5) + 1,
                        responsibility: Math.floor(Math.random() * 5) + 1,
                        relationships: Math.floor(Math.random() * 5) + 1
                    };
                    await insert('affective_domain', {
                        student_id: student.student_id,
                        session: student.session,
                        term,
                        ...affectiveTraits
                    });

                    // --- Psychomotor Domain ---
                    const psychomotorTraits = {
                        handling_tools: Math.floor(Math.random() * 5) + 1,
                        drawing: Math.floor(Math.random() * 5) + 1,
                        handwriting: Math.floor(Math.random() * 5) + 1,
                        public_speaking: Math.floor(Math.random() * 5) + 1,
                        speech_fluency: Math.floor(Math.random() * 5) + 1,
                        sports: Math.floor(Math.random() * 5) + 1
                    };
                    await insert('psychomotor_domain', {
                        student_id: student.student_id,
                        session: student.session,
                        term,
                        ...psychomotorTraits
                    });

                    // --- Report Remarks ---
                    const teacherRemarks = [
                        `${student.name} is a bright and diligent student. Always inquisitive and ready to learn.`,
                        `${student.name} shows great improvement and dedication.`,
                        `${student.name} is a hardworking student with a positive attitude.`,
                        `${student.name} needs to focus more on consistency.`
                    ];
                    const principalRemarks = [
                        'An outstanding result! Keep it up.',
                        'Very impressive performance. Continue the good work.',
                        'Good result, but there is room for improvement.',
                        'Encourage the student to work harder.'
                    ];
                    await insert('report_remarks', {
                        student_id: student.student_id,
                        session: student.session,
                        term,
                        teacher_remark: teacherRemarks[Math.floor(Math.random() * teacherRemarks.length)],
                        teacher_name: 'Mr. Adebayo Oluwaseun',
                        principal_remark: principalRemarks[Math.floor(Math.random() * principalRemarks.length)],
                        principal_name: 'Dr. Mrs. Okonkwo Ifeoma',
                        next_term_date: 'Mon, 07-January-2025',
                        report_date: new Date().toISOString().split('T')[0]
                    });
                }
            }

            console.log('✅ Full report data seeded for all students.');
        } else {
            console.log(`ℹ️ Students already exist (${studentCount} records). Skipping seed.`);
        }

        console.log('🎉 Database initialization complete!');
    } catch (error) {
        console.error('❌ Error during initialization:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        db.close();
    }
}

initDatabase();