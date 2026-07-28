/**
 * models/User.js – User model for authentication
 * Handles: Create, Find, Password verification
 */

const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const User = {

    /**
     * Find a user by username
     * @param {string} username - The username to search for
     * @returns {Promise<Object|null>} - User object or null
     */
    findByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id, username, password_hash, role FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row || null);
                }
            );
        });
    },

    /**
     * Find a user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} - User object or null
     */
    findById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id, username, role FROM users WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row || null);
                }
            );
        });
    },

    /**
     * Create a new user (hashes password automatically)
     * @param {Object} userData - { username, password, role }
     * @returns {Promise<number>} - The new user's ID
     */
    async create(userData) {
        const { username, password, role = 'admin' } = userData;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                [username, hashedPassword, role],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                }
            );
        });
    },

    /**
     * Verify a password against a stored hash
     * @param {string} plainText - The password entered by user
     * @param {string} hash - The stored hash from DB
     * @returns {Promise<boolean>} - True if match
     */
    async comparePassword(plainText, hash) {
        return await bcrypt.compare(plainText, hash);
    }
};

module.exports = User;