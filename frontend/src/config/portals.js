/**
 * Single source of truth for per-portal navigation (sidebar + bottom nav).
 * Replaces the copy-pasted, drifted nav lists previously baked into each
 * screen's raw HTML. Items with no real destination yet are `status:
 * 'planned'` and render disabled rather than silently mis-navigating.
 *
 * Populated one portal at a time as each portal's redesign phase begins.
 */
export const portals = {
  student: {
    id: 'student',
    label: 'Student Portal',
    homePath: '/student',
    brand: { wordmark: 'Mount Carmel', motto: 'Scientia et Virtus', mottoNote: 'Est. 1954' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/student', status: 'active' },
      { key: 'academics', label: 'Academics', icon: 'school', path: '/student/academics', status: 'planned' },
      { key: 'finance', label: 'Finance', icon: 'payments', path: '/student/finance', status: 'planned' },
      { key: 'schedule', label: 'Schedule', icon: 'calendar_today', path: '/student/schedule', status: 'planned' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/student', status: 'active' },
      { key: 'academics', label: 'Academics', icon: 'school', path: '/student/academics', status: 'planned' },
      { key: 'finance', label: 'Fees', icon: 'payments', path: '/student/finance', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/student/more', status: 'planned' },
    ],
  },
  superAdmin: {
    id: 'superAdmin',
    label: 'Super Admin Portal',
    homePath: '/super-admin',
    brand: { wordmark: 'Mount Carmel', tagline: 'Super Admin Portal' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/super-admin', status: 'active' },
      { key: 'schools', label: 'School Management', icon: 'domain', path: '/super-admin/schools', status: 'active' },
      { key: 'staff', label: 'Staff Management', icon: 'badge', path: '/super-admin/staff', status: 'active' },
      { key: 'applicants', label: 'Applicant Approvals', icon: 'pending_actions', path: '/super-admin/applicants', status: 'active' },
      { key: 'students', label: 'Student Management', icon: 'group', path: '/super-admin/students', status: 'planned' },
      { key: 'settings', label: 'Platform Settings', icon: 'settings', path: '/super-admin/settings', status: 'active' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/super-admin', status: 'active' },
      { key: 'schools', label: 'Schools', icon: 'domain', path: '/super-admin/schools', status: 'active' },
      { key: 'staff', label: 'Staff', icon: 'badge', path: '/super-admin/staff', status: 'active' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/super-admin/more', status: 'planned' },
    ],
  },
  admin: {
    id: 'admin',
    label: 'Admin Portal',
    homePath: '/admin',
    brand: { wordmark: 'Mount Carmel', tagline: 'Admin Portal' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin', status: 'active' },
      { key: 'students', label: 'Students', icon: 'school', path: '/admin/students', status: 'active' },
      { key: 'academics', label: 'Report Cards', icon: 'auto_stories', path: '/admin/academics/report-card', status: 'active' },
      { key: 'library', label: 'Library', icon: 'menu_book', path: '/admin/library', status: 'active' },
      { key: 'hostel', label: 'Hostel', icon: 'holiday_village', path: '/admin/hostel', status: 'active' },
      { key: 'inventory', label: 'Inventory', icon: 'inventory_2', path: '/admin/inventory', status: 'active' },
      { key: 'reception', label: 'Reception', icon: 'support_agent', path: '/admin/reception', status: 'active' },
      { key: 'recruitment', label: 'Recruitment', icon: 'badge', path: '/admin/recruitment', status: 'active' },
      { key: 'mess', label: 'Mess', icon: 'restaurant', path: '/admin/mess', status: 'active' },
      { key: 'transport', label: 'Transport', icon: 'directions_bus', path: '/admin/transport', status: 'active' },
      { key: 'activity', label: 'Activities', icon: 'event_available', path: '/admin/activity', status: 'active' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/admin', status: 'active' },
      { key: 'students', label: 'Students', icon: 'school', path: '/admin/students', status: 'active' },
      { key: 'academics', label: 'Academics', icon: 'auto_stories', path: '/admin/academics/report-card', status: 'active' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/admin/more', status: 'planned' },
    ],
  },
  teacher: {
    id: 'teacher',
    label: 'Teacher Portal',
    homePath: '/staff/teacher',
    brand: { wordmark: 'Mount Carmel' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/staff/dashboard', status: 'planned' },
      { key: 'classes', label: 'My Classes', icon: 'school', path: '/staff/teacher/classes', status: 'planned' },
      { key: 'score-entry', label: 'Score Entry', icon: 'auto_stories', path: '/staff/teacher', status: 'active' },
      { key: 'attendance', label: 'Attendance', icon: 'event_available', path: '/staff/teacher/attendance', status: 'planned' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/staff/teacher', status: 'active' },
      { key: 'classes', label: 'Classes', icon: 'school', path: '/staff/teacher/classes', status: 'planned' },
      { key: 'attendance', label: 'Attendance', icon: 'event_available', path: '/staff/teacher/attendance', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/staff/teacher/more', status: 'planned' },
    ],
  },
  classTeacher: {
    id: 'classTeacher',
    label: 'Class Teacher Portal',
    homePath: '/staff/class-teacher',
    brand: { wordmark: 'Mount Carmel' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/staff/class-teacher', status: 'active' },
      { key: 'my-class', label: 'My Class', icon: 'school', path: '/staff/class-teacher/class', status: 'planned' },
      { key: 'attendance', label: 'Attendance', icon: 'event_available', path: '/staff/class-teacher/attendance', status: 'planned' },
      { key: 'score-entry', label: 'Score Entry', icon: 'auto_stories', path: '/staff/teacher', status: 'linked' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/staff/class-teacher', status: 'active' },
      { key: 'my-class', label: 'My Class', icon: 'school', path: '/staff/class-teacher/class', status: 'planned' },
      { key: 'attendance', label: 'Attendance', icon: 'event_available', path: '/staff/class-teacher/attendance', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/staff/class-teacher/more', status: 'planned' },
    ],
  },
  examOfficer: {
    id: 'examOfficer',
    label: 'Exam Office Portal',
    homePath: '/staff/exam-officer',
    brand: { wordmark: 'Mount Carmel', tagline: 'Exam Officer' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/staff/exam-officer/dashboard', status: 'planned' },
      { key: 'schedule', label: 'Exam Schedule', icon: 'event_available', path: '/staff/exam-officer/schedule', status: 'planned' },
      { key: 'marksheets', label: 'Marksheets', icon: 'description', path: '/staff/exam-officer', status: 'active' },
      { key: 'grading', label: 'Grading Config', icon: 'settings', path: '/staff/exam-officer/grading', status: 'planned' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'description', path: '/staff/exam-officer', status: 'active' },
      { key: 'schedule', label: 'Schedule', icon: 'event_available', path: '/staff/exam-officer/schedule', status: 'planned' },
      { key: 'grading', label: 'Grading', icon: 'settings', path: '/staff/exam-officer/grading', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/staff/exam-officer/more', status: 'planned' },
    ],
  },
  libraryAttendant: {
    id: 'libraryAttendant',
    label: 'Library Portal',
    homePath: '/staff/library',
    brand: { wordmark: 'Mount Carmel', tagline: 'Library Portal' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/staff/library/dashboard', status: 'planned' },
      { key: 'catalog', label: 'Catalog', icon: 'book', path: '/staff/library', status: 'active' },
      { key: 'borrow-return', label: 'Borrow/Return', icon: 'swap_horiz', path: '/staff/library/circulation', status: 'planned' },
      { key: 'overdue', label: 'Overdue Tracker', icon: 'history_toggle_off', path: '/staff/library/overdue', status: 'planned' },
      { key: 'profile', label: 'Profile', icon: 'person', path: '/staff/library/profile', status: 'planned' },
    ],
    bottomNav: [
      { key: 'catalog', label: 'Catalog', icon: 'book', path: '/staff/library', status: 'active' },
      { key: 'borrow-return', label: 'Circulation', icon: 'swap_horiz', path: '/staff/library/circulation', status: 'planned' },
      { key: 'overdue', label: 'Overdue', icon: 'history_toggle_off', path: '/staff/library/overdue', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/staff/library/more', status: 'planned' },
    ],
  },
  bursary: {
    id: 'bursary',
    label: 'Bursary Portal',
    homePath: '/bursary',
    brand: { wordmark: 'Mount Carmel' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/bursary', status: 'active' },
      { key: 'transactions', label: 'Transactions', icon: 'receipt_long', path: '/bursary/transactions', status: 'planned' },
      { key: 'accounts', label: 'Student Accounts', icon: 'group', path: '/bursary/accounts', status: 'planned' },
      { key: 'reports', label: 'Reports', icon: 'summarize', path: '/bursary/reports', status: 'planned' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/bursary', status: 'active' },
      { key: 'transactions', label: 'Transactions', icon: 'receipt_long', path: '/bursary/transactions', status: 'planned' },
      { key: 'accounts', label: 'Accounts', icon: 'group', path: '/bursary/accounts', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/bursary/more', status: 'planned' },
    ],
  },
  parent: {
    id: 'parent',
    label: 'Parent Portal',
    homePath: '/parent',
    brand: { wordmark: 'Mount Carmel' },
    sidebarNav: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/parent', status: 'active' },
      { key: 'academics', label: 'Academics', icon: 'school', path: '/parent/academics', status: 'planned' },
      { key: 'finance', label: 'Finance', icon: 'payments', path: '/parent/finance', status: 'planned' },
      { key: 'schedule', label: 'Schedule', icon: 'calendar_today', path: '/parent/schedule', status: 'planned' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/parent', status: 'active' },
      { key: 'academics', label: 'Academics', icon: 'school', path: '/parent/academics', status: 'planned' },
      { key: 'finance', label: 'Fees', icon: 'payments', path: '/parent/finance', status: 'planned' },
      { key: 'more', label: 'More', icon: 'more_horiz', path: '/parent/more', status: 'planned' },
    ],
  },
};

export function getPortal(portalId) {
  const portal = portals[portalId];
  if (!portal) {
    throw new Error(`Unknown portal "${portalId}". Add it to src/config/portals.js.`);
  }
  return portal;
}
