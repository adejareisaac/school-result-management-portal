const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database file (inside the /database folder)
const dbPath = path.join(__dirname, '../database/school.db');

// Create a new database instance
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database successfully.');
    }
});

// Enable foreign key constraints (important for referential integrity)
db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
        console.warn('⚠️ Could not enable foreign keys:', err.message);
    }
});

module.exports = db;