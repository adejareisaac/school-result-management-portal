/**
 * services/authService.js – Authentication business logic
 */

const User = require('../models/User');

const AuthService = {

    /**
     * Login a user – validates credentials and returns user data
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Object>} - { id, username, role }
     * @throws {Error} - If user not found or password mismatch
     */
    async login(username, password) {
        // 1. Find the user
        const user = await User.findByUsername(username);
        if (!user) {
            throw new Error('Invalid username or password.');
        }

        // 2. Compare passwords
        const isMatch = await User.comparePassword(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid username or password.');
        }

        // 3. Return user data (exclude password_hash)
        const { id, username: uname, role } = user;
        return { id, username: uname, role };
    },

    /**
     * Logout – just a placeholder; actual logout is session destruction in controller
     * @param {Object} req - Express request object
     */
    logout(req) {
        // This is typically handled by req.session.destroy() in controller
        // But we keep it here for completeness
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) reject(err);
                resolve();
            });
        });
    },

    /**
     * Hash a plain-text password (used for seeding or creating users)
     * @param {string} plainPassword
     * @returns {Promise<string>} - Hashed password
     */
    async hashPassword(plainPassword) {
        const bcrypt = require('bcrypt');
        return await bcrypt.hash(plainPassword, 10);
    }
};

module.exports = AuthService;