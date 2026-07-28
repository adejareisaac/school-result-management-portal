require('dotenv').config();
const express = require('express');
const path = require('path');

// ---- Import Configs ----
const sessionMiddleware = require('./config/session');
const constants = require('./config/constants');
const db = require('./config/database'); // Connected and ready

// ---- Import Middlewares ----
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ---- Import Route Modules ----
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const resultRoutes = require('./routes/resultRoutes');
const reportRoutes = require('./routes/reportRoutes');  // <-- Add this
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//                      MIDDLEWARE PIPELINE
// ============================================================

// 1. Request logging (first)
app.use(logger);

// 2. Body parsers (for JSON and URL‑encoded data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 3. Session management
app.use(sessionMiddleware);

// 4. Static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// 5. Global variables for views (EJS or plain HTML)
app.use((req, res, next) => {
    res.locals.constants = constants;
    res.locals.appName = constants.APP_NAME;
    res.locals.schoolName = constants.SCHOOL_NAME;
    res.locals.currentUser = req.session?.user || null;
    next();
});

// ============================================================
//                      MOUNT ROUTES
// ============================================================

// Authentication (login/logout)
authRoutes(app);

// Student CRUD API (protected)
studentRoutes(app);

// Result CRUD API + public lookup
resultRoutes(app);
reportRoutes(app);   // <-- Add this

// HTML pages (both public and protected)
pageRoutes(app);

// ============================================================
//                      ERROR HANDLING (must be last)
// ============================================================

app.use(notFound);   // 404 handler
app.use(errorHandler); // 500 handler

// ============================================================
//                      START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🏫 School: ${constants.SCHOOL_NAME}`);
    console.log(`📚 Default Session: ${constants.DEFAULT_SESSION}`);
    console.log(`🔒 Protected routes: /dashboard, /students, /results`);
});