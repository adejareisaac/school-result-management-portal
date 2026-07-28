-- ================================================================
-- SCHEMA for School Result Management Portal (Enhanced)
-- ================================================================

-- Users table (teachers/admins)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
);

-- ================================================================
-- STUDENTS & PROFILE
-- ================================================================

-- Students table (base info)
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    class TEXT NOT NULL,
    session TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student Profile (extended info) – admission_no removed, required fields made NOT NULL
CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    dob TEXT NOT NULL,
    age TEXT NOT NULL,
    height TEXT,                -- optional
    weight TEXT,                -- optional
    club TEXT,                  -- optional
    fav_color TEXT,             -- optional
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- ================================================================
-- RESULTS (Cognitive Domain)
-- ================================================================

CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    subject TEXT NOT NULL,
    ca1 INTEGER DEFAULT 0,
    ca2 INTEGER DEFAULT 0,
    exam INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    grade TEXT,
    position TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(student_id, session, term, subject)
);

-- ================================================================
-- ATTENDANCE
-- ================================================================

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    days_opened INTEGER DEFAULT 0,
    days_present INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(student_id, session, term)
);

-- ================================================================
-- AFFECTIVE DOMAIN
-- ================================================================

CREATE TABLE IF NOT EXISTS affective_domain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    attentiveness INTEGER DEFAULT 0,
    honesty INTEGER DEFAULT 0,
    neatness INTEGER DEFAULT 0,
    politeness INTEGER DEFAULT 0,
    punctuality INTEGER DEFAULT 0,
    self_control INTEGER DEFAULT 0,
    obedience INTEGER DEFAULT 0,
    reliability INTEGER DEFAULT 0,
    responsibility INTEGER DEFAULT 0,
    relationships INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(student_id, session, term)
);

-- ================================================================
-- PSYCHOMOTOR DOMAIN
-- ================================================================

CREATE TABLE IF NOT EXISTS psychomotor_domain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    handling_tools INTEGER DEFAULT 0,
    drawing INTEGER DEFAULT 0,
    handwriting INTEGER DEFAULT 0,
    public_speaking INTEGER DEFAULT 0,
    speech_fluency INTEGER DEFAULT 0,
    sports INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(student_id, session, term)
);

-- ================================================================
-- REPORT REMARKS
-- ================================================================

CREATE TABLE IF NOT EXISTS report_remarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    session TEXT NOT NULL,
    term TEXT NOT NULL,
    teacher_remark TEXT,
    teacher_name TEXT,
    principal_remark TEXT,
    principal_name TEXT,
    next_term_date TEXT,
    report_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(student_id, session, term)
);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_session_term ON results(session, term);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_affective_student ON affective_domain(student_id);
CREATE INDEX IF NOT EXISTS idx_psychomotor_student ON psychomotor_domain(student_id);
CREATE INDEX IF NOT EXISTS idx_remarks_student ON report_remarks(student_id);