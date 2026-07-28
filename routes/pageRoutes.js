/**
 * routes/pageRoutes.js – HTML page routes (both public and protected)
 */

const PageController = require('../controllers/pageController');
const { requireAuth } = require('../middleware/authMiddleware');
const constants = require('../config/constants');
const db = require('../config/database');

module.exports = (app) => {
    // ============================================================
    // HTML PAGE ROUTES
    // ============================================================

    // Public pages
    app.get('/', PageController.home);
    app.get('/login', PageController.login);
    app.get('/view-result', PageController.viewResult);
    app.get('/result-sheet', PageController.resultSheet);

    // Protected pages (require login)
    app.get('/dashboard', requireAuth, PageController.dashboard);
    app.get('/students', requireAuth, PageController.studentsPage);
    app.get('/results', requireAuth, PageController.resultsPage);

    // ============================================================
    // API ROUTES (for dashboard)
    // ============================================================

    // ---- Get current session info ----
    app.get('/api/session', (req, res) => {
        if (req.session && req.session.user) {
            res.json({
                success: true,
                data: {
                    loggedInAt: req.session.user.loggedInAt || new Date().toISOString(),
                    username: req.session.user.username,
                    role: req.session.user.role
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }
    });

    // ---- Get Dashboard Data (all-in-one) ----
    app.get('/api/dashboard-data', async (req, res) => {
        try {
            // Only authenticated users
            if (!req.session || !req.session.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // Get student count
            const studentCount = await new Promise((resolve) => {
                db.get('SELECT COUNT(*) as count FROM students', (err, row) => {
                    resolve(row ? row.count : 0);
                });
            });

            // Get result count
            const resultCount = await new Promise((resolve) => {
                db.get('SELECT COUNT(*) as count FROM results', (err, row) => {
                    resolve(row ? row.count : 0);
                });
            });

            // Get last login from session
            const loggedInAt = req.session.user.loggedInAt || new Date().toISOString();

            // Get current user
            const { username, role } = req.session.user;

            // Calculate trends by comparing with previous session
            const currentSession = constants.DEFAULT_SESSION;
            const prevSession = '2024/2025';

            const getCountForSession = (table, session) => {
                return new Promise((resolve) => {
                    db.get(
                        `SELECT COUNT(*) as count FROM ${table} WHERE session = ?`,
                        [session],
                        (err, row) => resolve(row ? row.count : 0)
                    );
                });
            };

            const prevStudentCount = await getCountForSession('students', prevSession);
            const prevResultCount = await getCountForSession('results', prevSession);

            const studentTrend = prevStudentCount > 0
                ? `↑ ${Math.round(((studentCount - prevStudentCount) / prevStudentCount) * 100)}%`
                : '↑ 0%';

            const resultTrend = prevResultCount > 0
                ? `↑ ${Math.round(((resultCount - prevResultCount) / prevResultCount) * 100)}%`
                : '↑ 0%';

            res.json({
                success: true,
                data: {
                    totalStudents: studentCount,
                    totalResults: resultCount,
                    currentSession: constants.DEFAULT_SESSION,
                    currentTerm: constants.TERMS[0],
                    lastLogin: loggedInAt,
                    username: username,
                    role: role,
                    trends: {
                        students: studentTrend,
                        results: resultTrend
                    }
                }
            });
        } catch (error) {
            console.error('Dashboard data error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ---- Get Recent Activity ----
    app.get('/api/recent-activity', async (req, res) => {
        try {
            if (!req.session || !req.session.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // 1. Get latest 5 students
            const latestStudents = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT id, name, student_id, created_at, 'student' as type 
                     FROM students 
                     ORDER BY id DESC LIMIT 5`,
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            // 2. Get latest 5 results with student name
            const latestResults = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT r.id, r.student_id, s.name as student_name, r.subject, r.created_at, 'result' as type 
                     FROM results r 
                     JOIN students s ON r.student_id = s.student_id 
                     ORDER BY r.id DESC LIMIT 5`,
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            // 3. Combine and sort
            const activities = [...latestStudents, ...latestResults]
                .map(item => {
                    let text = '';
                    let icon = '';
                    if (item.type === 'student') {
                        text = `New student added: ${item.name} (${item.student_id})`;
                        icon = '👤';
                    } else if (item.type === 'result') {
                        text = `Result uploaded for ${item.student_name} - ${item.subject}`;
                        icon = '📝';
                    }
                    const time = item.created_at ? new Date(item.created_at) : new Date();
                    const timeAgo = timeAgoText(time);

                    return {
                        icon,
                        text,
                        time: timeAgo,
                        timestamp: time.getTime()
                    };
                })
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 8);

            res.json({ success: true, data: activities });
        } catch (error) {
            console.error('Recent activity error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
};

// Helper: time ago text (outside module.exports)
function timeAgoText(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
}