/**
 * dashboard.js – Fully dynamic dashboard (no hardcoded values)
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard loading...');

    // Elements
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');

    const totalStudentsEl = document.getElementById('totalStudents');
    const totalResultsEl = document.getElementById('totalResults');
    const currentSessionEl = document.getElementById('currentSession');
    const lastLoginEl = document.getElementById('lastLogin');
    const userNameEl = document.getElementById('userName');
    const studentsTrendEl = document.getElementById('studentsTrend');
    const resultsTrendEl = document.getElementById('resultsTrend');
    const sessionStatusEl = document.getElementById('sessionStatus');
    const loginStatusEl = document.getElementById('loginStatus');
    const currentDateEl = document.getElementById('currentDate');

    // Helper to update progress
    let progress = 0;
    const updateProgress = (step) => {
        progress += step;
        if (progressBar) {
            progressBar.style.width = Math.min(progress, 100) + '%';
        }
    };

    // Set current date (client-side, no hardcoding)
    if (currentDateEl) {
        const now = new Date();
        currentDateEl.textContent = now.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    try {
        // Fetch ALL dashboard data in ONE API call
        const response = await apiFetch('/api/dashboard-data');
        const data = response.data;

        // Populate stats
        totalStudentsEl.textContent = data.totalStudents || 0;
        totalResultsEl.textContent = data.totalResults || 0;
        currentSessionEl.textContent = data.currentSession || '—';
        userNameEl.textContent = data.username || 'Admin';

        // Last login
        if (data.lastLogin) {
            const loginDate = new Date(data.lastLogin);
            lastLoginEl.textContent = loginDate.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            lastLoginEl.textContent = 'Just now';
        }

        // Trends (from API)
        if (data.trends) {
            studentsTrendEl.textContent = data.trends.students || '↑ 0%';
            resultsTrendEl.textContent = data.trends.results || '↑ 0%';
        }

        // Session status
        sessionStatusEl.textContent = data.currentSession ? '✓' : '—';

        // Login status
        loginStatusEl.textContent = '✅ Verified';

        updateProgress(100);

        console.log('✅ Dashboard data loaded:', data);

        // Hide preloader
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 400);

    } catch (error) {
        console.error('❌ Dashboard Error:', error.message);
        const loaderText = document.querySelector('.loader-text');
        if (loaderText) {
            loaderText.textContent = '⚠️ Failed to load data. Please refresh.';
            loaderText.style.color = '#f87171';
        }
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 3000);
    }

    // ---- Fetch Recent Activity ----
try {
    const activityData = await apiFetch('/api/recent-activity');
    const activities = activityData.data || [];
    renderActivity(activities);
} catch (error) {
    console.warn('Failed to load recent activity:', error);
    document.getElementById('activityList').innerHTML = `
        <div class="activity-item" style="text-align:center; color:#94a3b8; padding:20px;">
            No recent activity.
        </div>
    `;
}

// ---- Render Activity Items ----
function renderActivity(activities) {
    const container = document.getElementById('activityList');
    if (!container) return;

    if (activities.length === 0) {
        container.innerHTML = `
            <div class="activity-item" style="text-align:center; color:#94a3b8; padding:20px;">
                No recent activity yet.
            </div>
        `;
        return;
    }

    container.innerHTML = activities.map(item => `
        <div class="activity-item">
            <span class="activity-icon">${item.icon}</span>
            <span class="activity-text">${item.text}</span>
            <span class="activity-time">${item.time}</span>
        </div>
    `).join('');
}
});