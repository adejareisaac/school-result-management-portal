/**
 * view-result.js – Student result lookup and display
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resultLookupForm');
    const displayDiv = document.getElementById('resultDisplay');
    const sheetContainer = document.getElementById('resultSheetContainer');
    const errorDiv = document.getElementById('lookupError');

    // If the URL has query parameters, auto-fetch
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
});

async function fetchResult(studentId, session, term) {
    const errorDiv = document.getElementById('lookupError');
    const displayDiv = document.getElementById('resultDisplay');
    const sheetContainer = document.getElementById('resultSheetContainer');

    try {
        errorDiv.style.display = 'none';
        displayDiv.style.display = 'none';

        const url = `/api/student-result?studentId=${encodeURIComponent(studentId)}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`;
        const data = await apiFetch(url);

        if (!data.success || !data.data) {
            throw new Error(data.error || 'No result found.');
        }

        const { student, results } = data.data;

        // Populate the result sheet
        populateResultSheet(student, results, session, term);

        displayDiv.style.display = 'block';

        // Scroll to result
        displayDiv.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message || 'Failed to load result. Please check the details and try again.';
        displayDiv.style.display = 'none';
    }
}

function populateResultSheet(student, results, session, term) {
    // Fill student info
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentGender').textContent = student.gender || '—';
    document.getElementById('studentClass').textContent = student.class;
    document.getElementById('studentSession').textContent = session;
    document.getElementById('studentAdmissionNo').textContent = student.student_id;
    // Additional fields can be filled if we have them; we'll leave placeholders
    document.getElementById('studentDOB').textContent = '—';
    document.getElementById('studentAge').textContent = '—';
    document.getElementById('studentHeight').textContent = '—';
    document.getElementById('studentWeight').textContent = '—';
    document.getElementById('studentClub').textContent = '—';
    document.getElementById('studentFavColor').textContent = '—';

    // Fill results table
    const tbody = document.getElementById('resultSheetBody');
    if (!tbody) return;

    if (results.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No subjects found for this term.</td></tr>`;
        return;
    }

    // Calculate totals
    let totalObtained = 0;
    let totalObtainable = results.length * 100; // assuming 100 per subject

    tbody.innerHTML = results.map(r => {
        totalObtained += r.score;
        return `
            <tr>
                <td>${r.subject}</td>
                <td>—</td> <!-- CA1 placeholder -->
                <td>—</td> <!-- CA2 placeholder -->
                <td>${r.score}</td>
                <td>${r.score}</td> <!-- total = exam (for simplicity) -->
                <td>${r.grade || '-'}</td>
                <td>${r.position || '-'}</td>
                <td>${r.remark || '-'}</td>
            </tr>
        `;
    }).join('');

    // Update summary
    document.getElementById('totalObtained').textContent = totalObtained;
    document.getElementById('totalObtainable').textContent = totalObtainable;
    const percentage = (totalObtained / totalObtainable) * 100;
    document.getElementById('percentage').textContent = percentage.toFixed(1) + '%';

    // Overall grade (simple mapping)
    let overallGrade = 'F';
    if (percentage >= 70) overallGrade = 'A';
    else if (percentage >= 60) overallGrade = 'B';
    else if (percentage >= 50) overallGrade = 'C';
    else if (percentage >= 40) overallGrade = 'D';
    else if (percentage >= 30) overallGrade = 'E';
    document.getElementById('overallGrade').textContent = overallGrade;

    // Grade analysis (counts)
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    results.forEach(r => {
        if (r.grade && gradeCounts.hasOwnProperty(r.grade)) {
            gradeCounts[r.grade]++;
        }
    });
    document.getElementById('countA').textContent = gradeCounts.A;
    document.getElementById('countB').textContent = gradeCounts.B;
    document.getElementById('countC').textContent = gradeCounts.C;
    document.getElementById('countD').textContent = gradeCounts.D;
    document.getElementById('countE').textContent = gradeCounts.E;
    document.getElementById('countF').textContent = gradeCounts.F;

    document.getElementById('totalSubjects').textContent = results.length;

    // Remarks placeholders
    document.getElementById('teacherRemark').textContent = '—';
    document.getElementById('principalRemark').textContent = '—';

    // Next term date placeholder
    document.getElementById('nextTermDate').textContent = '—';

    // Set term and session in header
    document.getElementById('reportSession').textContent = session;
    document.getElementById('reportTerm').textContent = term;
}