export const categories = [
  {
    key: 'family',
    label: 'Parent & Student',
    icon: 'family_restroom',
    description: "Enter your Student ID, or your parent email/phone — we'll detect which portal you need as you type.",
  },
  {
    key: 'staff',
    label: 'Staff Portal',
    icon: 'badge',
    description: 'Select your role below to sign in to the staff or admin console.',
  },
  {
    key: 'superAdmin',
    label: 'Super Admin',
    icon: 'shield_person',
    description: 'Restricted, platform-wide access for system administrators only.',
  },
];

export const familyRoles = {
  student: { key: 'student', label: 'Student', homePath: '/student', icon: 'school' },
  parent: { key: 'parent', label: 'Parent', homePath: '/parent', icon: 'family_restroom' },
};

export const staffRoles = [
  { key: 'Teacher', label: 'Teacher', homePath: '/staff/teacher', icon: 'auto_stories' },
  { key: 'ClassTeacher', label: 'Class Teacher', homePath: '/staff/class-teacher', icon: 'school' },
  { key: 'ExamOfficer', label: 'Exam Officer', homePath: '/staff/exam-officer', icon: 'description' },
  { key: 'LibraryAttendant', label: 'Library', homePath: '/staff/library', icon: 'menu_book' },
  { key: 'Admin', label: 'Admin', homePath: '/admin', icon: 'dashboard' },
  { key: 'Bursary', label: 'Bursary', homePath: '/bursary', icon: 'payments' },
];

export const superAdmin = {
  label: 'Super Admin',
  homePath: '/super-admin',
  icon: 'shield_person',
  idLabel: 'Super Admin ID',
  placeholder: 'e.g. MC-ROOT-001',
};

/** Frontend-only heuristic standing in for real credential lookup: an "@" or
 * phone-like string reads as a parent contact; anything else reads as a
 * student ID. Returns null while the field is empty. */
export function detectFamilyRole(value) {
  const v = value.trim();
  if (!v) return null;
  if (v.includes('@')) return 'parent';
  if (/^\+?[\d\s-]{7,}$/.test(v)) return 'parent';
  return 'student';
}
