/**
 * controllers/pageController.js – Renders HTML pages
 */

const path = require('path');

const PageController = {

    /**
     * Serve the home page
     */
    home(req, res) {
        res.sendFile('index.html', { root: './views' });
    },

    /**
     * Serve the login page (with redirect if already logged in)
     */
    login(req, res) {
        if (req.session.user) {
            return res.redirect('/dashboard');
        }
        res.sendFile('login.html', { root: './views' });
    },

    /**
     * Serve the dashboard (protected)
     */
    dashboard(req, res) {
        res.sendFile('dashboard.html', { root: './views' });
    },

    /**
     * Serve the students management page (protected)
     */
    studentsPage(req, res) {
        res.sendFile('students.html', { root: './views' });
    },

    /**
     * Serve the results management page (protected)
     */
    resultsPage(req, res) {
        res.sendFile('results.html', { root: './views' });
    },

    /**
     * Serve the view result page (public)
     */
    viewResult(req, res) {
        res.sendFile('view-result.html', { root: './views' });
    },

    /**
     * Serve the result sheet (public, often same as view-result but could be separate)
     */
    resultSheet(req, res) {
        res.sendFile('result-sheet.html', { root: './views' });
    }
};

module.exports = PageController;