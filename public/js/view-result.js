/**
 * view-result.js – Public result lookup (Full Report Card)
 * Report card markup matches the Bailey's Bowen College style sheet.
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resultLookupForm');
    const displayDiv = document.getElementById('resultDisplay');
    const errorDiv = document.getElementById('lookupError');
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
    document.getElementById('printResultBtn')?.addEventListener('click', () => {
        window.print();
    });
    document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
        downloadResultAsPdf();
    });
});
async function fetchResult(studentId, session, term) {
    const errorDiv = document.getElementById('lookupError');
    const displayDiv = document.getElementById('resultDisplay');
    const pdfContainer = document.getElementById('pdfContainer');
    try {
        errorDiv.style.display = 'none';
        displayDiv.style.display = 'none';
        pdfContainer.classList.remove('show');
        pdfContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b;">⏳ Loading result for ${studentId}...</div>`;
        const url = `/api/student-result?studentId=${encodeURIComponent(studentId)}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`;
        const data = await apiFetch(url);
        if (!data.success || !data.data) {
            throw new Error(data.error || 'No result found.');
        }
        const report = data.data;
        const htmlContent = renderFullReportCard(report, session, term);
        pdfContainer.innerHTML = `<div class="a4-paper">${htmlContent}</div>`;
        displayDiv.style.display = 'block';
        pdfContainer.classList.add('show');
        displayDiv.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message || 'Failed to load result. Please check the details and try again.';
        displayDiv.style.display = 'none';
        console.error('Result Fetch Error:', error);
    }
}
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        studentId: params.get('studentId'),
        session: params.get('session'),
        term: params.get('term')
    };
}
/* ---------------------------------------------------------------
   PDF export — fit-to-one-page
   ---------------------------------------------------------------
   Why this exists: html2canvas (which html2pdf.js uses under the
   hood) screenshots the DOM at its normal on-screen layout — it does
   NOT switch to @media print. Even with the CSS now unified to a
   single compact size, unusually long data (e.g. a lengthy remark,
   or a term with more subjects than the sample) can still push the
   report a few millimetres past 297mm. When that happens html2pdf
   silently starts a second page, which is where the "empty page with
   just a few boxes" bug came from.
   The fix: render the report into an off-screen clone, measure it,
   and if it's taller than one A4 page, scale it down (CSS zoom, which
   reflows the layout, not a transform) until it fits — then capture
   that clone. The on-screen preview and window.print() output are
   never touched, so nothing changes for the normal reading/printing
   experience; this only kicks in for the "Download PDF" button, and
   only when actually needed.
   --------------------------------------------------------------- */
async function downloadResultAsPdf() {
    const sourceEl = document.querySelector('#pdfContainer .a4-paper');
    if (!sourceEl) {
        showNotification('No result loaded to download.', 'error');
        return;
    }
    if (typeof html2pdf === 'undefined') {
        showNotification('PDF library is loading, please try again in a moment.', 'error');
        return;
    }

    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const PX_PER_MM = 96 / 25.4; // 96dpi CSS reference pixel ratio
    const pageWidthPx = A4_WIDTH_MM * PX_PER_MM;
    const pageHeightPx = A4_HEIGHT_MM * PX_PER_MM;
    const MIN_ZOOM = 0.75; // never shrink past this — stay legible

    // Off-screen clone at a fixed A4 pixel width so measurements are
    // consistent regardless of the visible viewport / container width.
    const clone = sourceEl.cloneNode(true);
    const stage = document.createElement('div');
    stage.style.position = 'fixed';
    stage.style.left = '-10000px';
    stage.style.top = '0';
    stage.style.width = `${pageWidthPx}px`;
    clone.style.width = `${pageWidthPx}px`;
    clone.style.maxWidth = 'none';
    clone.style.minHeight = '0';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.zoom = '1';
    stage.appendChild(clone);
    document.body.appendChild(stage);

    try {
        let zoom = 1;
        // Shrink-to-fit: reduce zoom in small steps until the clone's
        // rendered height fits one A4 page, or we hit the legibility floor.
        while (clone.scrollHeight > pageHeightPx && zoom > MIN_ZOOM) {
            zoom = Math.max(MIN_ZOOM, zoom - 0.02);
            clone.style.zoom = zoom;
        }

        const opt = {
            margin: 0,
            filename: 'Student_Report_Card.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                windowWidth: pageWidthPx,
                width: pageWidthPx,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all'] }
        };
        await html2pdf().set(opt).from(clone).save();
    } catch (error) {
        showNotification('Could not generate the PDF. Please try again.', 'error');
        console.error('PDF Export Error:', error);
    } finally {
        stage.remove();
    }
}
/* ---------------------------------------------------------------
   Shared config — school identity + rating trait lists.
   Change SCHOOL to re-brand the sheet without touching markup logic.
   --------------------------------------------------------------- */
const SCHOOL = {
    name: "Bailey's Bowen College",
    address: "No 14 Davis Cole Crescent, PrimeVille Estate, Surulere, Lagos State.",
    contact: "TEL: 08115414915, 07064852256; Email: baileysbowenmedia@gmail.com",
    logoUrl: "/img/school-logo.png",
    creditLine: "BAILEY'S BOWEN MEDIA"
};
const AFFECTIVE_TRAITS = ['attentiveness','honesty','neatness','politeness','punctuality','self_control','obedience','reliability','responsibility','relationships'];
const AFFECTIVE_LABELS = ['Attentiveness','Honesty','Neatness','Politeness','Punctuality/Assembly','Self Control/Calmness','Obedience','Reliability','Sense of Responsibility','Relationship With Others'];
const PSYCHOMOTOR_TRAITS = ['handling_tools','drawing','handwriting','public_speaking','speech_fluency','sports'];
const PSYCHOMOTOR_LABELS = ['Handling of Tools','Drawing / Painting','Handwriting','Public Speaking','Speech Fluency','Sports & Games'];
function renderRatingTable(title, traits, labels, data) {
    let t = `
        <div class="domain-block rating-domain">
            <div class="domain-label">${title}</div>
            <table class="rating-table">
                <thead>
                    <tr><th class="trait-col"></th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th></tr>
                </thead>
                <tbody>`;
    traits.forEach((trait, idx) => {
        const val = (data && data[trait]) || 0;
        t += `<tr><td class="trait-name">${labels[idx]}</td>`;
        for (let i = 5; i >= 1; i--) {
            t += `<td>${val === i ? '&#10003;' : ''}</td>`;
        }
        t += `</tr>`;
    });
    t += `</tbody></table></div>`;
    return t;
}
function renderFullReportCard(report, session, term) {
    const { student, profile = {}, results = [], attendance = {}, affective = {}, psychomotor = {}, remarks = {}, summary = {}, gradeAnalysis = {}, totalSubjects } = report;
    let html = `<div class="report-card read-only">`;
    // ===== SCHOOL HEADER =====
    html += `
        <div class="school-header">
            <img src="${SCHOOL.logoUrl}" class="school-logo" alt="School logo" onerror="this.style.display='none'">
            <h1>${SCHOOL.name}</h1>
            <p class="address">${SCHOOL.address}</p>
            <p class="contact">${SCHOOL.contact}</p>
        </div>
        <div class="report-title-bar">${term} Term Student's Performance Report</div>
    `;
    // ===== STUDENT PROFILE =====
    html += `
        <div class="student-profile">
            <div class="profile-photo">
                ${student.photo_url ? `<img src="${student.photo_url}" alt="Student photo">` : 'PHOTO'}
            </div>
            <div class="profile-row">
                <div class="profile-field wide"><label>Name:</label><span class="fill">${student.name || '—'}</span></div>
                <div class="profile-field"><label>Gender:</label><span class="fill">${student.gender || '—'}</span></div>
            </div>
            <div class="profile-row">
                <div class="profile-field"><label>Class:</label><span class="fill">${student.class || '—'}</span></div>
                <div class="profile-field"><label>Session:</label><span class="fill">${session}</span></div>
                <div class="profile-field"><label>Admission No:</label><span class="fill">${student.student_id || '—'}</span></div>
            </div>
            <div class="profile-row">
                <div class="profile-field"><label>D.O.B.:</label><span class="fill">${profile.dob || '—'}</span></div>
                <div class="profile-field"><label>Age:</label><span class="fill">${profile.age ? profile.age + 'yrs' : '—'}</span></div>
                <div class="profile-field"><label>Ht:</label><span class="fill">${profile.height ? profile.height + ' cm' : '—'}</span></div>
                <div class="profile-field"><label>Wt:</label><span class="fill">${profile.weight ? profile.weight + ' kg' : '—'}</span></div>
            </div>
            <div class="profile-row">
                <div class="profile-field wide"><label>Club/Society:</label><span class="fill">${profile.club || '—'}</span></div>
                <div class="profile-field"><label>Fav. Col:</label><span class="fill">${profile.fav_color || '—'}</span></div>
            </div>
        </div>
    `;
    // ===== BODY GRID: cognitive (left) vs affective/psychomotor (right) =====
    html += `<div class="report-body-grid">`;
    // ---- LEFT COLUMN ----
    html += `<div class="col-left">`;
    html += `
        <div class="domain-block cognitive-domain">
            <div class="domain-label">Cognitive Domain</div>
            <table class="result-table">
                <thead>
                    <tr>
                        <th rowspan="2" class="subj-col">Subjects</th>
                        <th class="rotate">C.A</th>
                        <th class="rotate">Exam</th>
                        <th class="rotate">Total</th>
                        <th class="rotate">Grade</th>
                        <th class="rotate">Position</th>
                        <th rowspan="2">Remarks</th>
                        <th class="rotate">Class Avg</th>
                    </tr>
                    <tr>
                        <th>40</th><th>60</th><th>100</th><th></th><th></th><th></th>
                    </tr>
                </thead>
                <tbody>`;
    if (results.length === 0) {
        html += `<tr><td colspan="8" style="text-align:center;">No results found for this session/term.</td></tr>`;
    } else {
        results.forEach(r => {
            const ca = (Number(r.ca1) || 0) + (Number(r.ca2) || 0);
            html += `
                <tr>
                    <td class="subj-name">${r.subject}</td>
                    <td>${ca}</td>
                    <td>${r.exam || 0}</td>
                    <td class="total-grade">${r.total || 0}</td>
                    <td class="total-grade">${r.grade || '-'}</td>
                    <td>${r.position || '-'}</td>
                    <td>${r.remark || '-'}</td>
                    <td>${r.class_avg || '-'}</td>
                </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    html += `
        <div class="bottom-row">
            <div class="box performance-summary">
                <div class="box-title">Performance Summary</div>
                <table class="mini-table">
                    <tr><td>Total Obtained</td><td>${summary.totalObtained || 0}</td></tr>
                    <tr><td>%Tage</td><td>${summary.percentage || 0}%</td></tr>
                    <tr><td>Total Obtainable</td><td>${summary.totalObtainable || 0}</td></tr>
                    <tr><td>Grade</td><td>${summary.grade || '-'}</td></tr>
                </table>
            </div>
            <div class="box grade-scale-box">
                <div class="box-title">Grade Scale</div>
                <p>70-100%=A(Excellent) &nbsp;60-69.9%=B(Very Good) &nbsp;50-59.9%=C(Good) &nbsp;40-49.9%=D(Pass) &nbsp;30-39.9%=E(Fair) &nbsp;0-29.9%=F(Weak)</p>
            </div>
        </div>
    `;
    html += `</div>`; // end col-left
    // ---- RIGHT COLUMN ----
    html += `<div class="col-right">`;
    const opened = attendance.days_opened || 0;
    const present = attendance.days_present || 0;
    const pct = opened ? Math.round((present / opened) * 1000) / 10 : 0;
    html += `
        <div class="box attendance-box">
            <div class="box-title">Attendance Summary</div>
            <table class="mini-table">
                <tr><td>No of Times School Opened</td><td>${opened}</td></tr>
                <tr><td>No of Times Present</td><td>${present} (${pct}%)</td></tr>
                <tr><td>No of Times Absent</td><td>${attendance.days_absent || 0}</td></tr>
            </table>
        </div>
    `;
    html += renderRatingTable('Affective Domain', AFFECTIVE_TRAITS, AFFECTIVE_LABELS, affective);
    html += renderRatingTable('Psychomotor Domain', PSYCHOMOTOR_TRAITS, PSYCHOMOTOR_LABELS, psychomotor);
    html += `
        <div class="bottom-row">
            <div class="box rating-indices-box">
                <div class="box-title">Rating Indices</div>
                <ul>
                    <li>5 - Maintains an Excellent degree of Observable traits.</li>
                    <li>4 - Maintains a High level of Observable traits.</li>
                    <li>3 - Acceptable level of Observable traits.</li>
                    <li>2 - Shows Minimal regard for Observable traits.</li>
                    <li>1 - Has No regard for Observable traits.</li>
                </ul>
                <div class="footer-credit">${SCHOOL.creditLine} &copy; ${new Date().getFullYear()}</div>
            </div>
            <div class="box grade-analysis-box">
                <div class="box-title">Grade Analysis</div>
                <table class="mini-table grade-analysis-table">
                    <tr><th>Grade</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr>
                    <tr><th>No</th><td>${gradeAnalysis.A || 0}</td><td>${gradeAnalysis.B || 0}</td><td>${gradeAnalysis.C || 0}</td><td>${gradeAnalysis.D || 0}</td><td>${gradeAnalysis.E || 0}</td><td>${gradeAnalysis.F || 0}</td></tr>
                </table>
                <div class="total-subjects">Total Subjects Offered: <strong>${totalSubjects || 0}</strong></div>
            </div>
        </div>
    `;
    html += `</div>`; // end col-right
    html += `</div>`; // end report-body-grid
    // ===== REMARKS =====
    html += `
        <div class="remarks-section">
            <div class="remark-row"><label>Teacher's Remark:</label></div>
            <div class="remark-text">${remarks.teacher_remark || '—'}</div>
            <div class="signature-line">
                <span>Teacher's Name: <strong>${remarks.teacher_name || '—'}</strong></span>
                <span>Sign: ______________</span>
            </div>
            <div class="remark-row"><label>Principal's Remark:</label></div>
            <div class="remark-text">${remarks.principal_remark || '—'}</div>
            <div class="signature-line">
                <span>Principal's Name: <strong>${remarks.principal_name || '—'}</strong></span>
                <span>Sign: ______________</span>
            </div>
            <div class="signature-line final-row">
                <span>Next Term Begins: <strong>${remarks.next_term_date || '—'}</strong></span>
                <span>Date: <strong>${remarks.report_date || new Date().toISOString().split('T')[0]}</strong></span>
            </div>
        </div>
    `;
    html += `</div>`;
    return html;
}