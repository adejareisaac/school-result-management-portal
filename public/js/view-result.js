/**
 * view-result.js – Public result lookup (Full Report Card)
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resultLookupForm');
    const displayDiv = document.getElementById('resultDisplay');
    const errorDiv = document.getElementById('lookupError');

    // Auto-fetch from URL parameters if present
    const params = getUrlParams();
    if (params.studentId && params.session && params.term) {
        document.getElementById('lookupStudentId').value = params.studentId;
        document.getElementById('lookupSession').value = params.session;
        document.getElementById('lookupTerm').value = params.term;
        fetchResult(params.studentId, params.session, params.term);
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('lookupStudentId').value.trim();
        const session = document.getElementById('lookupSession').value;
        const term = document.getElementById('lookupTerm').value;

        if (!studentId || !session || !term) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        fetchResult(studentId, session, term);
    });

    // Print button
    document.getElementById('printResultBtn')?.addEventListener('click', () => {
        window.print();
    });
});

async function fetchResult(studentId, session, term) {
    const errorDiv = document.getElementById('lookupError');
    const displayDiv = document.getElementById('resultDisplay');
    const container = document.getElementById('reportCardContainer');

    try {
        errorDiv.style.display = 'none';
        displayDiv.style.display = 'none';

        const url = `/api/student-result?studentId=${encodeURIComponent(studentId)}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`;
        const data = await apiFetch(url);

        if (!data.success || !data.data) {
            throw new Error(data.error || 'No result found.');
        }

        const report = data.data;
        container.innerHTML = renderFullReportCard(report, session, term);

        displayDiv.style.display = 'block';
        displayDiv.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message || 'Failed to load result. Please check the details and try again.';
        displayDiv.style.display = 'none';
    }
}

function renderFullReportCard(report, session, term) {
    const { student, profile, results, attendance, affective, psychomotor, remarks, summary, gradeAnalysis, totalSubjects } = report;

    // Helper to get ordinal suffix
    function getOrdinal(n) {
        if (n === 1) return 'st';
        if (n === 2) return 'nd';
        if (n === 3) return 'rd';
        return 'th';
    }

    let html = `<div class="report-card read-only">`;

    // ===== SCHOOL HEADER =====
    html += `
        <div class="school-header">
            <h1>Greenwood Academy</h1>
            <p>No 14 Davis Cole Crescent, PrimeVille Estate, Surulere, Lagos State.</p>
            <p>Tel: 08115414915, 07064852256 &bull; Email: info@greenwoodacademy.edu</p>
            <div class="report-title">${term} Term Student's Performance Report</div>
            <div style="font-weight:600; color:#2563eb; margin-top:4px;">Session: ${session}</div>
        </div>
    `;

    // ===== STUDENT PROFILE =====
    html += `
        <div class="student-profile">
            <div class="profile-field"><label>Name:</label> <span>${student.name}</span></div>
            <div class="profile-field"><label>Gender:</label> <span>${student.gender || '—'}</span></div>
            <div class="profile-field"><label>Class:</label> <span>${student.class}</span></div>
            <div class="profile-field"><label>Student ID:</label> <span>${student.student_id}</span></div>
            <div class="profile-field"><label>D.O.B.:</label> <span>${profile.dob || '—'}</span></div>
            <div class="profile-field"><label>Age:</label> <span>${profile.age || '—'}</span></div>
            <div class="profile-field"><label>Height (cm):</label> <span>${profile.height || '—'}</span></div>
            <div class="profile-field"><label>Weight (kg):</label> <span>${profile.weight || '—'}</span></div>
            <div class="profile-field"><label>Club/Society:</label> <span>${profile.club || '—'}</span></div>
            <div class="profile-field"><label>Fav. Colour:</label> <span>${profile.fav_color || '—'}</span></div>
        </div>
    `;

    // ===== COGNITIVE DOMAIN =====
    html += `<div class="section-title">📊 Cognitive Domain</div>`;
html += `<table class="result-table"><thead><tr>
    <th>Subjects</th><th>CA</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Position</th><th>Remark</th>
</tr></thead><tbody>`;

    if (results.length === 0) {
        html += `<tr><td colspan="8" style="text-align:center;">No results found for this session/term.</td></tr>`;
    } else {
        results.forEach(r => {
            html += `
                <tr>
                    <td><strong>${r.subject}</strong></td>
                    <td>${r.ca1 || 0}</td>
                    <td>${r.ca2 || 0}</td>
                    <td>${r.exam || 0}</td>
                    <td class="total-grade">${r.total || 0}</td>
                    <td class="total-grade">${r.grade || '-'}</td>
                    <td>${r.position || '-'}</td>
                    <td>${r.remark || '-'}</td>
                </tr>
            `;
        });
    }
    html += `</tbody></table>`;

    // ===== PERFORMANCE SUMMARY =====
    html += `
        <div class="summary-grid">
            <div class="summary-item"><span class="label">Total Obtained:</span> <span class="value">${summary.totalObtained || 0}</span></div>
            <div class="summary-item"><span class="label">Total Obtainable:</span> <span class="value">${summary.totalObtainable || 0}</span></div>
            <div class="summary-item"><span class="label">Percentage:</span> <span class="value">${summary.percentage || 0}%</span></div>
            <div class="summary-item"><span class="label">Grade:</span> <span class="value">${summary.grade || 'F'}</span></div>
        </div>
    `;

    // ===== GRADE SCALE =====
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

    // ===== ATTENDANCE SUMMARY =====
    html += `
        <div class="section-title">📅 Attendance Summary</div>
        <div class="attendance-grid">
            <div><label>No of Times School Opened:</label> <span>${attendance.days_opened || 0}</span></div>
            <div><label>No of Times Present:</label> <span>${attendance.days_present || 0}</span></div>
            <div><label>No of Times Absent:</label> <span>${attendance.days_absent || 0}</span></div>
        </div>
    `;

    // ===== AFFECTIVE DOMAIN =====
    html += `
        <div class="section-title">🧠 Affective Domain</div>
        <table class="rating-table"><thead><tr><th>Traits</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead><tbody>`;
    const affectiveTraits = ['attentiveness','honesty','neatness','politeness','punctuality','self_control','obedience','reliability','responsibility','relationships'];
    const affectiveLabels = ['Attentiveness','Honesty','Neatness','Politeness','Punctuality/Assembly','Self Control/Calmness','Obedience','Reliability','Sense of Responsibility','Relationship With Others'];
    affectiveTraits.forEach((trait, idx) => {
        const val = affective[trait] || 0;
        html += `<tr><td>${affectiveLabels[idx]}</td>`;
        for (let i = 5; i >= 1; i--) {
            html += `<td><span class="rating-btn ${val === i ? 'active' : ''}">${i}</span></td>`;
        }
        html += `</tr>`;
    });
    html += `</tbody></table>`;

    // ===== PSYCHOMOTOR DOMAIN =====
    html += `
        <div class="section-title">🏃 Psychomotor Domain</div>
        <table class="rating-table"><thead><tr><th>Traits</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead><tbody>`;
    const psychomotorTraits = ['handling_tools','drawing','handwriting','public_speaking','speech_fluency','sports'];
    const psychomotorLabels = ['Handling of Tools','Drawing / Painting','Handwriting','Public Speaking','Speech Fluency','Sports & Games'];
    psychomotorTraits.forEach((trait, idx) => {
        const val = psychomotor[trait] || 0;
        html += `<tr><td>${psychomotorLabels[idx]}</td>`;
        for (let i = 5; i >= 1; i--) {
            html += `<td><span class="rating-btn ${val === i ? 'active' : ''}">${i}</span></td>`;
        }
        html += `</tr>`;
    });
    html += `</tbody></table>`;

    // ===== GRADE ANALYSIS =====
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

    // ===== REMARKS =====
    html += `
        <div class="section-title">📝 Remarks</div>
        <div class="remarks-section">
            <div><label>Teacher's Remark:</label></div>
            <div class="remark-text">${remarks.teacher_remark || '—'}</div>
            <div class="signature-line">
                <span>Teacher's Name: ${remarks.teacher_name || '—'}</span>
                <span>Sign: ______________</span>
            </div>
        </div>
        <div class="remarks-section">
            <div><label>Principal's Remark:</label></div>
            <div class="remark-text">${remarks.principal_remark || '—'}</div>
            <div class="signature-line">
                <span>Principal's Name: ${remarks.principal_name || '—'}</span>
                <span>Sign: ______________</span>
            </div>
        </div>
        <div style="margin-top:12px; font-size:0.9rem; color:#64748b;">
            <label>Next Term Begins: ${remarks.next_term_date || '—'}</label>
            &nbsp;|&nbsp; <label>Date: ${remarks.report_date || new Date().toISOString().split('T')[0]}</label>
        </div>
    `;

    html += `</div>`;
    return html;
}