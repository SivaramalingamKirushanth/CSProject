/**
 * app.js
 * UI logic: login flow, student CRUD, search/filter, grades, CSV export.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const currentUserLabel = document.getElementById('currentUserLabel');
  const logoutBtn = document.getElementById('logoutBtn');

  const searchInput = document.getElementById('searchInput');
  const classFilter = document.getElementById('classFilter');
  const addStudentBtn = document.getElementById('addStudentBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const studentTableBody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');

  const studentModalEl = document.getElementById('studentModal');
  const studentModal = new bootstrap.Modal(studentModalEl);
  const studentForm = document.getElementById('studentForm');
  const studentModalTitle = document.getElementById('studentModalTitle');

  const viewModalEl = document.getElementById('viewModal');
  const viewModal = new bootstrap.Modal(viewModalEl);
  const viewStudentName = document.getElementById('viewStudentName');
  const viewStudentDetails = document.getElementById('viewStudentDetails');
  const gradeForm = document.getElementById('gradeForm');
  const gradeTableBody = document.getElementById('gradeTableBody');
  const gradeEmptyState = document.getElementById('gradeEmptyState');
  const gradeAverage = document.getElementById('gradeAverage');

  let currentViewStudentId = null;

  // ---------------------------------------------------------------
  // Screen toggling
  // ---------------------------------------------------------------
  function showApp() {
    loginScreen.classList.add('d-none');
    appScreen.classList.remove('d-none');
    currentUserLabel.textContent = Auth.getCurrentUser();
    refreshClassFilter();
    renderStudents();
  }

  function showLogin() {
    appScreen.classList.add('d-none');
    loginScreen.classList.remove('d-none');
    loginForm.reset();
    loginError.classList.add('d-none');
  }

  if (Auth.isLoggedIn()) {
    showApp();
  } else {
    showLogin();
  }

  // ---------------------------------------------------------------
  // Login / Logout
  // ---------------------------------------------------------------
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (Auth.login(username, password)) {
      showApp();
    } else {
      loginError.textContent = 'Invalid username or password.';
      loginError.classList.remove('d-none');
    }
  });

  logoutBtn.addEventListener('click', () => {
    Auth.logout();
    showLogin();
  });

  // ---------------------------------------------------------------
  // Toast helper
  // ---------------------------------------------------------------
  function showToast(message, type = 'success') {
    const toastEl = document.getElementById('appToast');
    const toastBody = document.getElementById('appToastBody');
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');
    toastEl.classList.add(type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-warning');
    toastBody.textContent = message;
    new bootstrap.Toast(toastEl, { delay: 2500 }).show();
  }

  // ---------------------------------------------------------------
  // Rendering: class filter dropdown
  // ---------------------------------------------------------------
  function refreshClassFilter() {
    const students = DataStore.getStudents();
    const classes = [...new Set(students.map((s) => s.studentClass).filter(Boolean))].sort();
    const currentValue = classFilter.value;
    classFilter.innerHTML = '<option value="">All Classes</option>';
    classes.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      classFilter.appendChild(opt);
    });
    if (classes.includes(currentValue)) classFilter.value = currentValue;
  }

  // ---------------------------------------------------------------
  // Rendering: student table + stats
  // ---------------------------------------------------------------
  function getFilteredStudents() {
    const query = searchInput.value.trim().toLowerCase();
    const classValue = classFilter.value;
    return DataStore.getStudents().filter((s) => {
      const matchesQuery =
        !query ||
        s.fullName.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query);
      const matchesClass = !classValue || s.studentClass === classValue;
      return matchesQuery && matchesClass;
    });
  }

  function computePercentage(student) {
    const grades = student.grades || [];
    if (!grades.length) return null;
    const totalMarks = grades.reduce((sum, g) => sum + Number(g.marks), 0);
    const totalMax = grades.reduce((sum, g) => sum + Number(g.maxMarks), 0);
    return totalMax ? (totalMarks / totalMax) * 100 : null;
  }

  function renderStudents() {
    const students = getFilteredStudents();
    studentTableBody.innerHTML = '';

    if (students.length === 0) {
      emptyState.classList.remove('d-none');
    } else {
      emptyState.classList.add('d-none');
    }

    students
      .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }))
      .forEach((s) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(s.rollNo)}</td>
          <td>${escapeHtml(s.fullName)}</td>
          <td>${escapeHtml(s.studentClass || '')}</td>
          <td>${escapeHtml(s.email || '')}</td>
          <td>${escapeHtml(s.phone || '')}</td>
          <td class="text-end action-btns">
            <button class="btn btn-sm btn-outline-info" data-action="view" title="View / Grades"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-primary" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </td>
        `;
        tr.querySelector('[data-action="view"]').addEventListener('click', () => openViewModal(s.id));
        tr.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(s.id));
        tr.querySelector('[data-action="delete"]').addEventListener('click', () => handleDelete(s.id));
        studentTableBody.appendChild(tr);
      });

    renderStats();
  }

  function renderStats() {
    const allStudents = DataStore.getStudents();
    const classes = new Set(allStudents.map((s) => s.studentClass).filter(Boolean));
    let totalPct = 0;
    let pctCount = 0;
    let gradeCount = 0;
    allStudents.forEach((s) => {
      gradeCount += (s.grades || []).length;
      const pct = computePercentage(s);
      if (pct !== null) {
        totalPct += pct;
        pctCount += 1;
      }
    });
    document.getElementById('statTotal').textContent = allStudents.length;
    document.getElementById('statClasses').textContent = classes.size;
    document.getElementById('statAvg').textContent = pctCount ? `${(totalPct / pctCount).toFixed(1)}%` : '0%';
    document.getElementById('statGrades').textContent = gradeCount;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  searchInput.addEventListener('input', renderStudents);
  classFilter.addEventListener('change', renderStudents);

  // ---------------------------------------------------------------
  // Add / Edit student
  // ---------------------------------------------------------------
  addStudentBtn.addEventListener('click', () => openAddModal());

  function openAddModal() {
    studentForm.reset();
    document.getElementById('studentId').value = '';
    studentModalTitle.textContent = 'Add Student';
    studentModal.show();
  }

  function openEditModal(id) {
    const student = DataStore.getStudentById(id);
    if (!student) return;
    studentForm.reset();
    document.getElementById('studentId').value = student.id;
    document.getElementById('rollNo').value = student.rollNo || '';
    document.getElementById('fullName').value = student.fullName || '';
    document.getElementById('studentClass').value = student.studentClass || '';
    document.getElementById('dob').value = student.dob || '';
    document.getElementById('gender').value = student.gender || '';
    document.getElementById('email').value = student.email || '';
    document.getElementById('phone').value = student.phone || '';
    document.getElementById('enrollmentDate').value = student.enrollmentDate || '';
    document.getElementById('address').value = student.address || '';
    studentModalTitle.textContent = 'Edit Student';
    studentModal.show();
  }

  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const rollNo = document.getElementById('rollNo').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();

    if (!rollNo || !fullName || !studentClass) {
      showToast('Please fill in all required fields.', 'danger');
      return;
    }

    if (DataStore.isRollNoTaken(rollNo, id || undefined)) {
      showToast(`Roll No "${rollNo}" is already in use.`, 'danger');
      return;
    }

    const payload = {
      rollNo,
      fullName,
      studentClass,
      dob: document.getElementById('dob').value,
      gender: document.getElementById('gender').value,
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      enrollmentDate: document.getElementById('enrollmentDate').value,
      address: document.getElementById('address').value.trim(),
    };

    if (id) {
      DataStore.updateStudent(id, payload);
      showToast('Student updated successfully.');
    } else {
      DataStore.addStudent(payload);
      showToast('Student added successfully.');
    }

    studentModal.hide();
    refreshClassFilter();
    renderStudents();
  });

  // ---------------------------------------------------------------
  // Delete student
  // ---------------------------------------------------------------
  function handleDelete(id) {
    const student = DataStore.getStudentById(id);
    if (!student) return;
    if (!confirm(`Delete student "${student.fullName}" (Roll No ${student.rollNo})? This cannot be undone.`)) {
      return;
    }
    DataStore.deleteStudent(id);
    showToast('Student deleted.', 'warning');
    refreshClassFilter();
    renderStudents();
  }

  // ---------------------------------------------------------------
  // View student + grades
  // ---------------------------------------------------------------
  function openViewModal(id) {
    currentViewStudentId = id;
    renderViewModal();
    viewModal.show();
  }

  function renderViewModal() {
    const student = DataStore.getStudentById(currentViewStudentId);
    if (!student) return;

    viewStudentName.textContent = `${student.fullName} (Roll No ${student.rollNo})`;
    viewStudentDetails.innerHTML = `
      <div class="col-md-4"><strong>Class:</strong> ${escapeHtml(student.studentClass || '-')}</div>
      <div class="col-md-4"><strong>Gender:</strong> ${escapeHtml(student.gender || '-')}</div>
      <div class="col-md-4"><strong>DOB:</strong> ${escapeHtml(student.dob || '-')}</div>
      <div class="col-md-4"><strong>Email:</strong> ${escapeHtml(student.email || '-')}</div>
      <div class="col-md-4"><strong>Phone:</strong> ${escapeHtml(student.phone || '-')}</div>
      <div class="col-md-4"><strong>Enrolled:</strong> ${escapeHtml(student.enrollmentDate || '-')}</div>
      <div class="col-12"><strong>Address:</strong> ${escapeHtml(student.address || '-')}</div>
    `;

    document.getElementById('gradeStudentId').value = student.id;
    gradeForm.reset();
    document.getElementById('gradeMaxMarks').value = 100;

    const grades = student.grades || [];
    gradeTableBody.innerHTML = '';
    if (grades.length === 0) {
      gradeEmptyState.classList.remove('d-none');
    } else {
      gradeEmptyState.classList.add('d-none');
    }

    grades.forEach((g) => {
      const pct = ((Number(g.marks) / Number(g.maxMarks)) * 100).toFixed(1);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(g.subject)}</td>
        <td>${escapeHtml(g.term || '-')}</td>
        <td>${escapeHtml(g.marks)}</td>
        <td>${escapeHtml(g.maxMarks)}</td>
        <td>${pct}%</td>
        <td><button class="btn btn-sm btn-outline-danger" data-action="delete-grade"><i class="bi bi-trash"></i></button></td>
      `;
      tr.querySelector('[data-action="delete-grade"]').addEventListener('click', () => {
        const gradeLabel = `${g.subject} (${g.term || 'No term'})`;
        if (!confirm(`Delete grade "${gradeLabel}" for ${student.fullName}?`)) {
          return;
        }
        DataStore.deleteGrade(student.id, g.id);
        showToast('Grade deleted.', 'warning');
        renderViewModal();
        renderStudents();
      });
      gradeTableBody.appendChild(tr);
    });

    const pctOverall = computePercentage(student);
    gradeAverage.textContent = pctOverall !== null ? `Overall: ${pctOverall.toFixed(1)}%` : '';
  }

  gradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = document.getElementById('gradeStudentId').value;
    const subject = document.getElementById('gradeSubject').value.trim();
    const term = document.getElementById('gradeTerm').value.trim();
    const marks = Number(document.getElementById('gradeMarks').value);
    const maxMarks = Number(document.getElementById('gradeMaxMarks').value);

    if (!subject || Number.isNaN(marks) || Number.isNaN(maxMarks) || maxMarks <= 0) {
      showToast('Please provide valid grade details.', 'danger');
      return;
    }
    if (marks > maxMarks) {
      showToast('Marks cannot exceed max marks.', 'danger');
      return;
    }

    DataStore.addGrade(studentId, { subject, term, marks, maxMarks });
    showToast('Grade added.');
    renderViewModal();
    renderStudents();
  });

  // ---------------------------------------------------------------
  // Export CSV
  // ---------------------------------------------------------------
  exportCsvBtn.addEventListener('click', () => {
    const students = getFilteredStudents();
    if (students.length === 0) {
      showToast('No students to export.', 'warning');
      return;
    }

    const headers = [
      'Roll No', 'Full Name', 'Class', 'Gender', 'DOB', 'Email', 'Phone',
      'Enrollment Date', 'Address', 'Overall Percentage',
    ];
    const rows = students.map((s) => {
      const pct = computePercentage(s);
      return [
        s.rollNo, s.fullName, s.studentClass, s.gender || '', s.dob || '',
        s.email || '', s.phone || '', s.enrollmentDate || '', s.address || '',
        pct !== null ? pct.toFixed(1) : '',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_records_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV export started.');
  });

  function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
});
