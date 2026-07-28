/**
 * login.js – Login page interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('loginError');

    if (!form) return;

    // Check if error parameter is present (from server redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = urlParams.get('error') || 'Invalid credentials.';
    }

    form.addEventListener('submit', function(e) {
        // Basic client validation
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            e.preventDefault();
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Please fill in both fields.';
            return;
        }

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in…';
        }

        // Form will submit normally – no need to prevent default
    });
});