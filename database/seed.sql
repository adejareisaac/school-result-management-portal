-- ============================================
-- SEED DATA (Reference only – use init.js)
-- ============================================

-- Default admin (password: password123) – hash is for reference
-- INSERT INTO users (username, password_hash, role) 
-- VALUES ('admin', '$2b$10$...', 'admin');

-- Sample students
-- INSERT INTO students (student_id, name, gender, class, session) 
-- VALUES ('STD-2026-001', 'Alice Johnson', 'Female', 'SS3', '2025/2026');

-- Sample results
-- INSERT INTO results (student_id, session, term, subject, score, position, remark) 
-- VALUES ('STD-2026-001', '2025/2026', 'First', 'Mathematics', 85, '1st', 'Excellent');