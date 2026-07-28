/**
 * public/js/students.js – Frontend for Student Management
 * Handles: Load students, search, add, edit, delete (with modals)
 */

let currentStudents = [];
let editingId = null;
let deleteTargetId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Students page loaded');

    // Elements
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');
    const addBtn = document.getElementById('addStudentBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    const modal = document.getElementById('studentModal');
    const deleteModal = document.getElementById('deleteModal');
    const form = document.getElementById('studentForm');
    const modalTitle = document.getElementById('modalTitle');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Helper to update progress
    let progress = 0;
    const updateProgress = (step) => {
        progress += step;
        if (progressBar) {
            progressBar.style.width = Math.min(progress, 100) + '%';
        }
    };

    try {
        // Load students
        await loadStudents();
        updateProgress(100);

        // Hide preloader
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 400);

    } catch (error) {
        console.error('❌ Error loading students:', error);
        const loaderText = document.querySelector('.loader-text');
        if (loaderText) {
            loaderText.textContent = '⚠️ Failed to load data. Please refresh.';
            loaderText.style.color = '#f87171';
        }
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 3000);
    }

    // ---- Add button ----
    addBtn?.addEventListener('click', () => {
        editingId = null;
        modalTitle.textContent = 'Add Student';
        document.getElementById('editId').value = '';
        form.reset();
        document.getElementById('studentId').disabled = false;
        openModal('studentModal');
    });

    // ---- Search ----
    searchBtn?.addEventListener('click', () => {
        const keyword = searchInput.value.trim();
        loadStudents(keyword);
    });

    searchInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = e.target.value.trim() ? 'block' : 'none';
        }
    });

    clearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        loadStudents();
    });

    // ---- Form submit ----
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveStudent();
    });

    // ---- Cancel modal ----
    cancelModalBtn?.addEventListener('click', () => {
        closeModal('studentModal');
    });

    // ---- Cancel delete ----
    cancelDeleteBtn?.addEventListener('click', () => {
        closeModal('deleteModal');
    });

    // ---- Confirm delete ----
    confirmDeleteBtn?.addEventListener('click', async () => {
        if (deleteTargetId) {
            await deleteStudent(deleteTargetId);
            deleteTargetId = null;
            closeModal('deleteModal');
        }
    });

    // ---- Close modals with X ----
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.classList.remove('show');
        });
    });

    // ---- Close modal on backdrop click ----
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
});

// ---- Load students from API ----
async function loadStudents(keyword = '') {
    try {
        let url = '/api/students';
        if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }
        const data = await apiFetch(url);
        currentStudents = data.data || [];
        renderStudentTable(currentStudents);
        updateStats(currentStudents.length);
    } catch (error) {
        showNotification('Failed to load students.', 'error');
        console.error('Load error:', error);
    }
}

// ---- Update stats ----
function updateStats(count) {
    const statsEl = document.getElementById('studentsCount');
    if (statsEl) {
        statsEl.textContent = `${count} student${count !== 1 ? 's' : ''}`;
    }
}

// ---- Render table ----
function renderStudentTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('studentsTable');

    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (table) table.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = '';

    tbody.innerHTML = students.map((s, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${s.student_id}</strong></td>
            <td>${s.name}</td>
            <td>${s.gender || '—'}</td>
            <td><span class="class-badge">${s.class}</span></td>
            <td>${s.session}</td>
            <td>
                <div class="actions">
                    <button class="btn-sm btn-edit" data-id="${s.id}">✏️ Edit</button>
                    <button class="btn-sm btn-delete" data-id="${s.id}">🗑️ Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Attach event listeners
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editStudent(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => confirmDeleteStudent(btn.dataset.id));
    });
}

// ---- Edit student ----
async function editStudent(id) {
    const student = currentStudents.find(s => s.id == id);
    if (!student) return;

    editingId = id;
    document.getElementById('editId').value = id;
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentGender').value = student.gender || '';
    document.getElementById('studentClass').value = student.class;
    document.getElementById('studentSession').value = student.session;
    document.getElementById('studentId').value = student.student_id;
    document.getElementById('studentId').disabled = true;

    // Profile fields (admission_no removed)
    document.getElementById('studentDOB').value = student.dob || '';
    document.getElementById('studentAge').value = student.age || '';
    document.getElementById('studentHeight').value = student.height || '';
    document.getElementById('studentWeight').value = student.weight || '';
    document.getElementById('studentClub').value = student.club || '';
    document.getElementById('studentFavColor').value = student.fav_color || '';

    openModal('studentModal');
}

// ---- Save student (Add or Update) ----
async function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    const gender = document.getElementById('studentGender').value;
    const cls = document.getElementById('studentClass').value.trim();
    const session = document.getElementById('studentSession').value;
    const studentId = document.getElementById('studentId').value.trim();
    const editId = document.getElementById('editId').value;

    // Profile fields
    const dob = document.getElementById('studentDOB').value.trim();
    const age = document.getElementById('studentAge').value.trim();
    const height = document.getElementById('studentHeight').value.trim();
    const weight = document.getElementById('studentWeight').value.trim();
    const club = document.getElementById('studentClub').value.trim();
    const favColor = document.getElementById('studentFavColor').value.trim();

    // Validation: name, gender, class, session, dob, age are required
    if (!name || !gender || !cls || !session || !dob || !age) {
        showNotification('Please fill in all required fields (Name, Gender, Class, Session, DOB, Age).', 'error');
        return;
    }

    const payload = { name, gender, class: cls, session };
    if (studentId && !editId) payload.student_id = studentId;

    // Build profile object (only optional fields are height, weight, club, fav_color)
    const profile = {};
    if (dob) profile.dob = dob;
    if (age) profile.age = age;
    if (height) profile.height = height;
    if (weight) profile.weight = weight;
    if (club) profile.club = club;
    if (favColor) profile.fav_color = favColor;

    if (Object.keys(profile).length > 0) {
        payload.profile = profile;
    }

    try {
        if (editId) {
            await apiFetch(`/api/students/${editId}`, { method: 'PUT', body: payload });
            showNotification('Student updated successfully.');
        } else {
            await apiFetch('/api/students', { method: 'POST', body: payload });
            showNotification('Student added successfully.');
        }
        closeModal('studentModal');
        await loadStudents(document.getElementById('searchInput').value.trim());
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ---- Confirm delete ----
function confirmDeleteStudent(id) {
    const student = currentStudents.find(s => s.id == id);
    if (!student) return;
    deleteTargetId = id;
    document.getElementById('deleteStudentName').textContent = student.name;
    openModal('deleteModal');
}

// ---- Delete student ----
async function deleteStudent(id) {
    try {
        await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
        showNotification('Student deleted successfully.');
        await loadStudents(document.getElementById('searchInput').value.trim());
    } catch (error) {
        showNotification(error.message, 'error');
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