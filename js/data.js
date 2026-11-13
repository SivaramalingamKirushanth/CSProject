/**
 * data.js
 * Simple localStorage-backed data layer for students and admin credentials.
 * Acts as the "database" for this client-only application.
 */

const STORAGE_KEYS = {
  STUDENTS: 'srm_students',
  ADMIN: 'srm_admin',
};

const DataStore = {
  // ---------- Admin credentials ----------
  getAdmin() {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN);
    if (raw) return JSON.parse(raw);
    const defaultAdmin = { username: 'admin', password: 'admin123' };
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(defaultAdmin));
    return defaultAdmin;
  },

  updateAdmin(admin) {
    const safeAdmin = {
      username: String(admin?.username || '').trim(),
      password: String(admin?.password || '').trim(),
    };
    if (!safeAdmin.username || !safeAdmin.password) return null;
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(safeAdmin));
    return safeAdmin;
  },

  // ---------- Students ----------
  getStudents() {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) return JSON.parse(raw);
    const seed = this._seedStudents();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(seed));
    return seed;
  },

  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  createId(prefix = 's') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  },

  addStudent(student) {
    const students = this.getStudents();
    student.id = student.id || this.createId('s');
    student.grades = student.grades || [];
    students.push(student);
    this.saveStudents(students);
    return student;
  },

  updateStudent(id, updates) {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    students[idx] = { ...students[idx], ...updates };
    this.saveStudents(students);
    return students[idx];
  },

  deleteStudent(id) {
    const students = this.getStudents().filter((s) => s.id !== id);
    this.saveStudents(students);
  },

  getStudentById(id) {
    return this.getStudents().find((s) => s.id === id) || null;
  },

  isRollNoTaken(rollNo, excludeId) {
    return this.getStudents().some(
      (s) => s.rollNo.toLowerCase() === rollNo.toLowerCase() && s.id !== excludeId
    );
  },

  // ---------- Grades ----------
  addGrade(studentId, grade) {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) return null;
    grade.id = grade.id || this.createId('g');
    student.grades = student.grades || [];
    student.grades.push(grade);
    this.saveStudents(students);
    return grade;
  },

  deleteGrade(studentId, gradeId) {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    student.grades = (student.grades || []).filter((g) => g.id !== gradeId);
    this.saveStudents(students);
  },

  exportBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      admin: this.getAdmin(),
      students: this.getStudents(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importBackup(rawData) {
    if (!rawData || typeof rawData !== 'string') {
      throw new Error('No backup data found.');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch (error) {
      throw new Error('The selected file is not valid JSON.');
    }

    const incomingStudents = Array.isArray(parsed) ? parsed : parsed.students;
    if (!Array.isArray(incomingStudents)) {
      throw new Error('The imported file does not contain student records.');
    }

    const normalizedStudents = incomingStudents.map((student) => ({
      ...student,
      id: student.id || this.createId('s'),
      grades: Array.isArray(student.grades)
        ? student.grades.map((grade) => ({
            ...grade,
            id: grade.id || this.createId('g'),
          }))
        : [],
    }));

    if (parsed.admin && parsed.admin.username && parsed.admin.password) {
      this.updateAdmin(parsed.admin);
    }

    this.saveStudents(normalizedStudents);
    return normalizedStudents;
  },

  resetDemoData() {
    const seed = this._seedStudents();
    this.saveStudents(seed);
    return seed;
  },

  // ---------- Seed demo data ----------
  _seedStudents() {
    return [
      {
        id: 's1',
        rollNo: '101',
        fullName: 'Aarav Sharma',
        studentClass: 'Grade 10-A',
        dob: '2010-04-15',
        gender: 'Male',
        email: 'aarav.sharma@example.com',
        phone: '555-0101',
        enrollmentDate: '2022-06-01',
        address: '12 Lotus Street, Springfield',
        grades: [
          { id: 'g1', subject: 'Mathematics', term: 'Term 1', marks: 88, maxMarks: 100 },
          { id: 'g2', subject: 'Science', term: 'Term 1', marks: 92, maxMarks: 100 },
        ],
      },
      {
        id: 's2',
        rollNo: '102',
        fullName: 'Isha Patel',
        studentClass: 'Grade 10-A',
        dob: '2010-07-22',
        gender: 'Female',
        email: 'isha.patel@example.com',
        phone: '555-0102',
        enrollmentDate: '2022-06-01',
        address: '34 Maple Avenue, Springfield',
        grades: [
          { id: 'g3', subject: 'Mathematics', term: 'Term 1', marks: 95, maxMarks: 100 },
          { id: 'g4', subject: 'English', term: 'Term 1', marks: 89, maxMarks: 100 },
        ],
      },
      {
        id: 's3',
        rollNo: '201',
        fullName: 'Liam O\'Connor',
        studentClass: 'Grade 11-B',
        dob: '2009-01-09',
        gender: 'Male',
        email: 'liam.oconnor@example.com',
        phone: '555-0103',
        enrollmentDate: '2021-06-01',
        address: '7 Birch Road, Springfield',
        grades: [],
      },
    ];
  },
};
