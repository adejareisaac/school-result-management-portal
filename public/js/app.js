/**
 * app.js – Shared utilities for the portal
 */

// ---- Toast Notification System ----
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.toast-container');
    const container = existing || (() => {
        const div = document.createElement('div');
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ---- API Fetch Wrapper ----
async function apiFetch(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };
    const merged = { ...defaultOptions, ...options };

    if (options.body && typeof options.body === 'object') {
        merged.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, merged);

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            let errorMsg;
            try {
                const data = await response.json();
                errorMsg = data.error || data.message || 'An error occurred.';
            } catch {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || response.status === 204) {
            return null;
        }

        return response.json();
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

// ---- Get URL Parameters ----
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}

// ---- Show/Hide Modal ----
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// ---- Close modal on backdrop click ----
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.classList.remove('show');
        });
    });
});