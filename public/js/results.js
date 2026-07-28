/**
 * results.js – Student List + Report Card Modal
 */

let students = [];
let currentReportData = null;
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Results page loaded');

    // Elements
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    const refreshBtn = document.getElementById('refreshStudentsBtn');
    const sessionSelect = document.getElementById('reportSession');
    const termSelect = document.getElementById('reportTerm');
    const modal = document.getElementById('reportModal');

    // Helper to update progress
    let progress = 0;
    const updateProgress = (step) => {
        progress += step;
        if (progressBar) {
            progressBar.style.width = Math.min(progress, 100) + '%';
        }
    };

    try {
        await loadStudents();
        updateProgress(100);
        setTimeout(() => preloader.classList.add('hidden'), 400);
    } catch (error) {
        console.error('❌ Error:', error);
        const loaderText = document.querySelector('.loader-text');
        if (loaderText) {
            loaderText.textContent = '⚠️ Failed to load data. Please refresh.';
            loaderText.style.color = '#f87171';
        }
        setTimeout(() => preloader.classList.add('hidden'), 3000);
    }

    // ---- Search ----
    searchBtn?.addEventListener('click', () => {
        const keyword = searchInput.value.trim();
        renderStudentList(students, keyword);
    });
    searchInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchBtn.click();
        if (clearBtn) clearBtn.style.display = e.target.value.trim() ? 'block' : 'none';
    });
    clearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        renderStudentList(students);
    });
    refreshBtn?.addEventListener('click', loadStudents);

    // ---- Close modal ----
    modal?.querySelector('.modal-close')?.addEventListener('click', () => closeModal('reportModal'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal('reportModal'); });
});

// ---- Load students ----
async function loadStudents() {
    try {
        const data = await apiFetch('/api/students');
        students = data.data || [];
        renderStudentList(students);
        document.getElementById('studentsCount').textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;
    } catch (error) {
        showNotification('Failed to load students.', 'error');
        console.error(error);
    }
}

// ---- Render student list ----
function renderStudentList(allStudents, keyword = '') {
    const tbody = document.getElementById('studentsTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('studentsTable');

    let filtered = allStudents;
    if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        filtered = allStudents.filter(s =>
            s.name.toLowerCase().includes(k) ||
            s.student_id.toLowerCase().includes(k)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    emptyState.style.display = 'none';
    table.style.display = '';

    tbody.innerHTML = filtered.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${s.student_id}</strong></td>
            <td>${s.name}</td>
            <td>${s.class}</td>
            <td>${s.session}</td>
            <td>
                <button class="btn-sm btn-view-report" data-id="${s.student_id}">📄 Report</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.btn-view-report').forEach(btn => {
        btn.addEventListener('click', () => openReport(btn.dataset.id));
    });
}

// ---- Open report modal ----
async function openReport(studentId) {
    currentStudentId = studentId;
    const session = document.getElementById('reportSession').value;
    const term = document.getElementById('reportTerm').value;

    try {
        showNotification('Loading report...', 'info');
        const data = await apiFetch(`/api/report/${studentId}?session=${session}&term=${term}`);
        if (!data.success) throw new Error(data.error || 'Failed to load report');
        currentReportData = data.data;
        renderReport(currentReportData);
        openModal('reportModal');
    } catch (error) {
        showNotification(error.message, 'error');
        console.error(error);
    }
}

// ---- Render report card inside modal ----
function renderReport(report) {
    const container = document.getElementById('reportCardContainer');
    const { student, profile, results, attendance, affective, psychomotor, remarks, summary, gradeAnalysis, totalSubjects } = report;

    // Build HTML
    let html = `<div class="report-card">`;

    // School header
    html += `
        <div class="school-header">
            <h1>Greenwood Academy</h1>
            <p>No 14 Davis Cole Crescent, PrimeVille Estate, Surulere, Lagos State.</p>
            <p>Tel: 08115414915, 07064852256 &bull; Email: info@greenwoodacademy.edu</p>
            <div class="report-title">${document.getElementById('reportTerm').value} Term Student's Performance Report</div>
            <div style="font-weight:600; color:#2563eb;">Session: ${document.getElementById('reportSession').value}</div>
        </div>
    `;

    // Student profile (editable)
// Student profile (editable) – no admission_no
html += `
    <div class="student-profile">
        <div class="profile-field"><label>Name:</label> <span>${student.name}</span></div>
        <div class="profile-field"><label>Gender:</label> <span>${student.gender || '—'}</span></div>
        <div class="profile-field"><label>Class:</label> <span>${student.class}</span></div>
        <div class="profile-field"><label>D.O.B.:</label> <input type="text" id="editDOB" value="${profile.dob || ''}" required /></div>
        <div class="profile-field"><label>Age:</label> <input type="text" id="editAge" value="${profile.age || ''}" required /></div>
        <div class="profile-field"><label>Height (cm):</label> <input type="text" id="editHeight" value="${profile.height || ''}" /></div>
        <div class="profile-field"><label>Weight (kg):</label> <input type="text" id="editWeight" value="${profile.weight || ''}" /></div>
        <div class="profile-field"><label>Club/Society:</label> <input type="text" id="editClub" value="${profile.club || ''}" /></div>
        <div class="profile-field"><label>Fav. Colour:</label> <input type="text" id="editFavColor" value="${profile.fav_color || ''}" /></div>
    </div>
`;

    // Cognitive Domain
    html += `<div class="section-title">📊 Cognitive Domain</div>`;
    html += `<table class="result-table"><thead><tr>
        <th>Subject</th><th>CA1</th><th>CA2</th><th>Exam</th><th>Total</th><th>Grade</th><th>Position</th><th>Remark</th>
    </tr></thead><tbody>`;

    if (results.length === 0) {
        html += `<tr><td colspan="8" style="text-align:center;">No results found for this session/term.</td></tr>`;
    } else {
        results.forEach(r => {
            html += `
                <tr>
                    <td>${r.subject}</td>
                    <td><input type="number" class="edit-ca1" data-id="${r.id}" value="${r.ca1 || 0}" min="0" max="50" /></td>
                    <td><input type="number" class="edit-ca2" data-id="${r.id}" value="${r.ca2 || 0}" min="0" max="50" /></td>
                    <td><input type="number" class="edit-exam" data-id="${r.id}" value="${r.exam || 0}" min="0" max="100" /></td>
                    <td class="total-grade">${r.total || 0}</td>
                    <td class="total-grade">${r.grade || '-'}</td>
                    <td><input type="text" class="edit-position" data-id="${r.id}" value="${r.position || ''}" /></td>
                    <td><input type="text" class="edit-remark" data-id="${r.id}" value="${r.remark || ''}" /></td>
                </tr>
            `;
        });
    }
    html += `</tbody></table>`;

    // Performance Summary
    html += `
        <div class="summary-grid">
            <div class="summary-item"><span class="label">Total Obtained:</span> <span class="value">${summary.totalObtained || 0}</span></div>
            <div class="summary-item"><span class="label">Total Obtainable:</span> <span class="value">${summary.totalObtainable || 0}</span></div>
            <div class="summary-item"><span class="label">Percentage:</span> <span class="value">${summary.percentage || 0}%</span></div>
            <div class="summary-item"><span class="label">Grade:</span> <span class="value">${summary.grade || 'F'}</span></div>
        </div>
    `;

    // Grade Scale
    html += `
        <div class="grade-scale">
            <span>A (70-100%) – Excellent</span>
            <span>B (60-69.9%) – Very Good</span>
            <span>C (50-59.9%) – Good</span>
            <span>D (40-49.9%) – Pass</span>
            <span>E (30-39.9%) – Fair</span>
            <span>F (0-29.9%) – Weak</span>
        </div>
    `;

    // Attendance
    html += `
        <div class="section-title">📅 Attendance Summary</div>
        <div class="attendance-grid">
            <div><label>No. of Times School Opened:</label> <input type="number" id="editDaysOpened" value="${attendance.days_opened || 0}" /></div>
            <div><label>No. of Times Present:</label> <input type="number" id="editDaysPresent" value="${attendance.days_present || 0}" /></div>
            <div><label>No. of Times Absent:</label> <input type="number" id="editDaysAbsent" value="${attendance.days_absent || 0}" /></div>
        </div>
    `;

    // Affective Domain
    html += `
        <div class="section-title">🧠 Affective Domain</div>
        <table class="rating-table"><thead><tr><th>Traits</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead><tbody>`;
    const affectiveTraits = ['attentiveness','honesty','neatness','politeness','punctuality','self_control','obedience','reliability','responsibility','relationships'];
    const affectiveLabels = ['Attentiveness','Honesty','Neatness','Politeness','Punctuality','Self Control','Obedience','Reliability','Sense of Responsibility','Relationship With Others'];
    affectiveTraits.forEach((trait, idx) => {
        const val = affective[trait] || 0;
        html += `<tr><td>${affectiveLabels[idx]}</td>`;
        for (let i = 5; i >= 1; i--) {
            html += `<td><span class="rating-btn ${val === i ? 'active' : ''}" data-trait="${trait}" data-value="${i}">${i}</span></td>`;
        }
        html += `</tr>`;
    });
    html += `</tbody></table>`;

    // Psychomotor Domain
    html += `
        <div class="section-title">🏃 Psychomotor Domain</div>
        <table class="rating-table"><thead><tr><th>Traits</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead><tbody>`;
    const psychomotorTraits = ['handling_tools','drawing','handwriting','public_speaking','speech_fluency','sports'];
    const psychomotorLabels = ['Handling of Tools','Drawing / Painting','Handwriting','Public Speaking','Speech Fluency','Sports & Games'];
    psychomotorTraits.forEach((trait, idx) => {
        const val = psychomotor[trait] || 0;
        html += `<tr><td>${psychomotorLabels[idx]}</td>`;
        for (let i = 5; i >= 1; i--) {
            html += `<td><span class="rating-btn ${val === i ? 'active' : ''}" data-trait="${trait}" data-value="${i}">${i}</span></td>`;
        }
        html += `</tr>`;
    });
    html += `</tbody></table>`;

    // Remarks
    html += `
        <div class="section-title">📝 Remarks</div>
        <div class="remarks-section">
            <div><label>Teacher's Remark:</label></div>
            <textarea id="editTeacherRemark">${remarks.teacher_remark || ''}</textarea>
            <div class="signature-line">
                <span>Teacher's Name: <input type="text" id="editTeacherName" value="${remarks.teacher_name || ''}" /></span>
                <span>Sign: <input type="text" id="editTeacherSign" placeholder="__________" /></span>
            </div>
        </div>
        <div class="remarks-section">
            <div><label>Principal's Remark:</label></div>
            <textarea id="editPrincipalRemark">${remarks.principal_remark || ''}</textarea>
            <div class="signature-line">
                <span>Principal's Name: <input type="text" id="editPrincipalName" value="${remarks.principal_name || ''}" /></span>
                <span>Sign: <input type="text" id="editPrincipalSign" placeholder="__________" /></span>
            </div>
        </div>
        <div style="margin-top:12px;">
            <label>Next Term Begins: <input type="text" id="editNextTermDate" value="${remarks.next_term_date || ''}" /></label>
        </div>
    `;

    // Grade Analysis
    html += `
        <div class="section-title">📊 Grade Analysis</div>
        <div class="summary-grid" style="background:#f1f5f9;">
            <div class="summary-item"><span class="label">A:</span> <span class="value">${gradeAnalysis.A || 0}</span></div>
            <div class="summary-item"><span class="label">B:</span> <span class="value">${gradeAnalysis.B || 0}</span></div>
            <div class="summary-item"><span class="label">C:</span> <span class="value">${gradeAnalysis.C || 0}</span></div>
            <div class="summary-item"><span class="label">D:</span> <span class="value">${gradeAnalysis.D || 0}</span></div>
            <div class="summary-item"><span class="label">E:</span> <span class="value">${gradeAnalysis.E || 0}</span></div>
            <div class="summary-item"><span class="label">F:</span> <span class="value">${gradeAnalysis.F || 0}</span></div>
            <div class="summary-item"><span class="label">Total Subjects:</span> <span class="value">${totalSubjects || 0}</span></div>
        </div>
    `;

    // Actions
    html += `
        <div class="modal-actions">
            <button class="btn btn-secondary" id="printReportBtn">🖨️ Print</button>
            <button class="btn btn-primary" id="saveReportBtn">💾 Save Report</button>
        </div>
    `;

    html += `</div>`; // end report-card

    container.innerHTML = html;

    // ---- Attach event listeners for rating buttons ----
    container.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.closest('td');
            const row = parent.closest('tr');
            // Remove active class from all buttons in this row's column group?
            // Simpler: remove active from all siblings in the same row with same trait
            const trait = this.dataset.trait;
            const value = parseInt(this.dataset.value);
            const allButtons = row.querySelectorAll(`.rating-btn[data-trait="${trait}"]`);
            allButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Store value in dataset of row or input
            // We'll read them later when saving.
        });
    });

    // ---- Attach save report ----
    document.getElementById('saveReportBtn')?.addEventListener('click', saveReport);

    // ---- Attach print ----
    document.getElementById('printReportBtn')?.addEventListener('click', () => {
        const content = document.getElementById('reportCardContainer');
        const win = window.open('', '_blank');
        win.document.write('<html><head><title>Report Card</title><link rel="stylesheet" href="/css/global.css" /><link rel="stylesheet" href="/css/print.css" /></head><body>');
        win.document.write(content.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        win.print();
    });
}

// ---- Save report ----
async function saveReport() {
    const container = document.getElementById('reportCardContainer');
    const studentId = currentStudentId;
    const session = document.getElementById('reportSession').value;
    const term = document.getElementById('reportTerm').value;

// Gather profile data (no admission_no)
const profile = {
    dob: document.getElementById('editDOB').value.trim(),
    age: document.getElementById('editAge').value.trim(),
    height: document.getElementById('editHeight').value.trim(),
    weight: document.getElementById('editWeight').value.trim(),
    club: document.getElementById('editClub').value.trim(),
    fav_color: document.getElementById('editFavColor').value.trim()
};

    // Gather results
    const resultRows = container.querySelectorAll('.result-table tbody tr');
    const results = [];
    resultRows.forEach(row => {
        const id = row.querySelector('.edit-ca1')?.dataset.id;
        if (id) {
            const ca1 = parseInt(row.querySelector('.edit-ca1').value) || 0;
            const ca2 = parseInt(row.querySelector('.edit-ca2').value) || 0;
            const exam = parseInt(row.querySelector('.edit-exam').value) || 0;
            const position = row.querySelector('.edit-position').value.trim();
            const remark = row.querySelector('.edit-remark').value.trim();
            results.push({ id, ca1, ca2, exam, position, remark });
        }
    });

    // Gather attendance
    const attendance = {
        days_opened: parseInt(document.getElementById('editDaysOpened').value) || 0,
        days_present: parseInt(document.getElementById('editDaysPresent').value) || 0,
        days_absent: parseInt(document.getElementById('editDaysAbsent').value) || 0
    };

    // Gather affective domain
    const affective = {};
    const affectiveTraits = ['attentiveness','honesty','neatness','politeness','punctuality','self_control','obedience','reliability','responsibility','relationships'];
    affectiveTraits.forEach(trait => {
        const active = container.querySelector(`.rating-btn[data-trait="${trait}"].active`);
        affective[trait] = active ? parseInt(active.dataset.value) : 0;
    });

    // Gather psychomotor
    const psychomotor = {};
    const psychomotorTraits = ['handling_tools','drawing','handwriting','public_speaking','speech_fluency','sports'];
    psychomotorTraits.forEach(trait => {
        const active = container.querySelector(`.rating-btn[data-trait="${trait}"].active`);
        psychomotor[trait] = active ? parseInt(active.dataset.value) : 0;
    });

    // Gather remarks
    const remarks = {
        teacher_remark: document.getElementById('editTeacherRemark').value.trim(),
        teacher_name: document.getElementById('editTeacherName').value.trim(),
        principal_remark: document.getElementById('editPrincipalRemark').value.trim(),
        principal_name: document.getElementById('editPrincipalName').value.trim(),
        next_term_date: document.getElementById('editNextTermDate').value.trim(),
        report_date: new Date().toISOString().split('T')[0]
    };

    const payload = {
        session,
        term,
        profile,
        results,
        attendance,
        affective,
        psychomotor,
        remarks
    };

    try {
        const response = await apiFetch(`/api/report/${studentId}`, {
            method: 'PUT',
            body: payload
        });
        if (response.success) {
            showNotification('Report saved successfully!');
            // Re-render to reflect updated totals/grades
            openReport(studentId);
        } else {
            showNotification(response.error || 'Failed to save report.', 'error');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        console.error(error);
    }
}

// ---- Modal helpers ----
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}