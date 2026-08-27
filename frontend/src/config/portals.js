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
      { key: 'profile', label: 'Profile', icon: 'person', path: '/student/profile', status: 'active' },
      { key: 'class', label: 'Class & Subjects', icon: 'school', path: '/student/class', status: 'active' },
      { key: 'timetable', label: 'Timetable', icon: 'calendar_today', path: '/student/timetable', status: 'active' },
      { key: 'attendance', label: 'Attendance', icon: 'event_available', path: '/student/attendance', status: 'active' },
      { key: 'assignments', label: 'Assignments', icon: 'assignment', path: '/student/assignments', status: 'active' },
      { key: 'results', label: 'Results', icon: 'grading', path: '/student/results', status: 'active' },
      { key: 'finance', label: 'School Fees', icon: 'payments', path: '/student/finance', status: 'active' },
      { key: 'library', label: 'Library', icon: 'menu_book', path: '/student/library', status: 'active' },
      { key: 'hostel', label: 'Hostel', icon: 'holiday_village', path: '/student/hostel', status: 'active' },
      { key: 'transport', label: 'Transport', icon: 'directions_bus', path: '/student/transport', status: 'active' },
      { key: 'resources', label: 'E-Learning / Resources', icon: 'auto_stories', path: '/student/resources', status: 'active' },
      { key: 'announcements', label: 'Announcements', icon: 'campaign', path: '/student/announcements', status: 'active' },
      { key: 'events', label: 'Events / Calendar', icon: 'event', path: '/student/events', status: 'active' },
      { key: 'messages', label: 'Messages', icon: 'forum', path: '/student/messages', status: 'active' },
      { key: 'settings', label: 'Settings', icon: 'settings', path: '/student/settings', status: 'active' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/student', status: 'active' },
      { key: 'finance', label: 'Fees', icon: 'payments', path: '/student/finance', status: 'active' },
      { key: 'results', label: 'Results', icon: 'grading', path: '/student/results', status: 'active' },
      { key: 'more', label: 'More', icon: 'more_horiz', status: 'more' },
    ],
  },
  superAdmin: {
    id: 'superAdmin',
    label: 'Super Admin Portal',
    homePath: '/super-admin',
    brand: { wordmark: 'Mount Carmel', tagline: 'Super Admin Portal' },
    // Exact 9-section IA as specified — every item below must exist, in
    // this order, with these exact labels. Items with a real page behind
    // them are 'active'; everything else is 'planned' (disabled, "Soon")
    // until its own build phase, per the incremental build-one-at-a-time
    // plan. Operations deliberately does NOT duplicate Reception (owned by
    // Administration) or Transport/Hostel/Mess (owned by Student Services)
    // — each of those lives under exactly one section. The one remaining
    // intentional duplicate is Roles & Permissions (Administration and
    // System both link to /super-admin/roles), which stays since it's a
    // genuinely cross-cutting page, not an ownership overlap.
    sidebarNav: [
      {
        key: 'dashboard', label: 'Dashboard', icon: 'dashboard',
        children: [
          { key: 'dashboard-overview', label: 'Overview / Statistics', icon: 'query_stats', path: '/super-admin', status: 'active' },
          { key: 'dashboard-financial', label: 'Financial Summary', icon: 'payments', path: '/super-admin/financial-summary', status: 'active' },
          { key: 'dashboard-academic', label: 'Academic Summary', icon: 'school', path: '/super-admin/academic-summary', status: 'active' },
          { key: 'dashboard-operations', label: 'Operations Summary', icon: 'monitoring', path: '/super-admin/operations-summary', status: 'active' },
          { key: 'dashboard-activities', label: 'Recent Activities', icon: 'history', path: '/super-admin/recent-activities', status: 'active' },
          { key: 'dashboard-notifications', label: 'Notifications', icon: 'notifications', path: '/super-admin/notifications', status: 'active' },
        ],
      },
      {
        key: 'administration', label: 'Administration', icon: 'corporate_fare',
        children: [
          { key: 'admin-school-configuration', label: 'School Configuration', icon: 'domain', path: '/super-admin/configuration', status: 'active' },
          { key: 'admin-academic-sessions-terms', label: 'Academic Session & Terms', icon: 'calendar_month', path: '/super-admin/administration/academic-session-terms', status: 'active' },
          { key: 'admin-classes-arms', label: 'Classes & Arms', icon: 'class', path: '/super-admin/administration/classes-arms', status: 'active' },
          { key: 'admin-departments', label: 'Departments', icon: 'apartment', path: '/super-admin/administration/departments', status: 'active' },
          { key: 'admin-staff-management', label: 'Staff Management', icon: 'badge', path: '/super-admin/staff', status: 'active' },
          { key: 'admin-user-management', label: 'User Management', icon: 'manage_accounts', path: '/super-admin/administration/user-management', status: 'active' },
          { key: 'admin-roles-permissions', label: 'Roles & Permissions', icon: 'admin_panel_settings', path: '/super-admin/roles', status: 'active' },
          { key: 'admin-reception', label: 'Reception', icon: 'support_agent', path: '/super-admin/administration/reception', status: 'active' },
          { key: 'admin-communication', label: 'Communication', icon: 'forum', path: '/super-admin/administration/communication', status: 'active' },
          { key: 'admin-calendar', label: 'Calendar', icon: 'event', path: '/super-admin/administration/calendar', status: 'active' },
          { key: 'admin-website-cms', label: 'Website / CMS', icon: 'language', path: '/super-admin/administration/website-cms', status: 'active' },
        ],
      },
      {
        key: 'academic-management', label: 'Academic Management', icon: 'auto_stories',
        children: [
          { key: 'academic-students', label: 'Students', icon: 'school', path: '/super-admin/academic/students', status: 'active' },
          { key: 'academic-teachers', label: 'Teachers', icon: 'groups', path: '/super-admin/academic/teachers', status: 'active' },
          { key: 'academic-subjects', label: 'Subjects', icon: 'subject', path: '/super-admin/academic/subjects', status: 'active' },
          { key: 'academic-classes', label: 'Classes', icon: 'class', path: '/super-admin/academic/classes', status: 'active' },
          { key: 'academic-timetable', label: 'Timetable', icon: 'schedule', path: '/super-admin/academic/timetable', status: 'active' },
          { key: 'academic-attendance', label: 'Attendance', icon: 'fact_check', path: '/super-admin/academic/attendance', status: 'active' },
          { key: 'academic-exams', label: 'Exams', icon: 'quiz', path: '/super-admin/academic/exams', status: 'active' },
          { key: 'academic-results', label: 'Results / Marksheets', icon: 'grading', path: '/super-admin/academic/results', status: 'active' },
          { key: 'academic-assignments', label: 'Assignments', icon: 'assignment', path: '/super-admin/academic/assignments', status: 'active' },
          { key: 'academic-promotion', label: 'Promotion', icon: 'trending_up', path: '/super-admin/academic/promotion', status: 'active' },
          { key: 'academic-reports', label: 'Academic Reports', icon: 'summarize', path: '/super-admin/academic/reports', status: 'active' },
        ],
      },
      {
        key: 'finance', label: 'Finance', icon: 'account_balance_wallet',
        children: [
          { key: 'finance-school-fees', label: 'School Fees', icon: 'payments', path: '/super-admin/finance/school-fees', status: 'active' },
          { key: 'finance-fee-structures', label: 'Fee Structures', icon: 'request_quote', path: '/super-admin/finance/fee-structures', status: 'active' },
          { key: 'finance-invoices', label: 'Invoices', icon: 'receipt_long', path: '/super-admin/finance/invoices', status: 'active' },
          { key: 'finance-payments', label: 'Payments', icon: 'point_of_sale', path: '/super-admin/finance/payments', status: 'active' },
          { key: 'finance-receipts', label: 'Receipts', icon: 'receipt', path: '/super-admin/finance/receipts', status: 'active' },
          { key: 'finance-expenses', label: 'Expenses', icon: 'trending_down', path: '/super-admin/finance/expenses', status: 'active' },
          { key: 'finance-payroll', label: 'Payroll', icon: 'work', path: '/super-admin/finance/payroll', status: 'active' },
          { key: 'finance-reports', label: 'Financial Reports', icon: 'bar_chart', path: '/super-admin/finance/reports', status: 'active' },
        ],
      },
      {
        key: 'student-services', label: 'Student Services', icon: 'family_restroom',
        children: [
          { key: 'services-library', label: 'Library', icon: 'menu_book', path: '/super-admin/student-services/library', status: 'active' },
          { key: 'services-hostel', label: 'Hostel', icon: 'holiday_village', path: '/super-admin/student-services/hostel', status: 'active' },
          { key: 'services-transport', label: 'Transport', icon: 'directions_bus', path: '/super-admin/student-services/transport', status: 'active' },
          { key: 'services-mess', label: 'School Meals / Mess', icon: 'restaurant', path: '/super-admin/student-services/mess', status: 'active' },
          { key: 'services-activities', label: 'Activities', icon: 'sports_soccer', path: '/super-admin/student-services/activities', status: 'active' },
          { key: 'services-resources', label: 'Student Resources', icon: 'folder_shared', path: '/super-admin/student-services/resources', status: 'active' },
          { key: 'services-health', label: 'Health / Medical Records', icon: 'medical_services', path: '/super-admin/student-services/health', status: 'active' },
        ],
      },
      {
        key: 'operations', label: 'Operations', icon: 'engineering',
        children: [
          { key: 'ops-hr', label: 'HR', icon: 'badge', path: '/super-admin/operations/hr', status: 'active' },
          { key: 'ops-recruitment', label: 'Recruitment', icon: 'person_search', path: '/super-admin/operations/recruitment', status: 'active' },
          { key: 'ops-inventory', label: 'Inventory', icon: 'inventory_2', path: '/super-admin/operations/inventory', status: 'active' },
          { key: 'ops-assets', label: 'Assets', icon: 'warehouse', path: '/super-admin/operations/assets', status: 'active' },
        ],
      },
      {
        // Replaces the former separate "Communication & Public Website",
        // "Configuration", and "System" sections — see portals.js audit
        // notes (2026-08) for what was merged/removed/kept. Roles &
        // Permissions and Academic Sessions/Classes & Departments were
        // duplicated 2-4x across those sections; they're linked once here
        // (Users & Security) and remain reachable via Administration too,
        // rather than triplicated. Audit Logs/Login History and System
        // Settings previously claimed 'active' while rendering static mock
        // data — status reflects real state until each phase lands.
        key: 'system-config', label: 'System & Config', icon: 'settings_applications',
        children: [
          { key: 'sc-general', label: 'General', icon: 'domain', path: '/super-admin/system-config/general', status: 'active' },
          { key: 'sc-appearance', label: 'Appearance', icon: 'palette', path: '/super-admin/system-config/appearance', status: 'active' },
          { key: 'sc-academic', label: 'Academic', icon: 'grading', path: '/super-admin/system-config/academic', status: 'active' },
          { key: 'sc-student-admission', label: 'Student & Admission', icon: 'school', path: '/super-admin/system-config/student-admission', status: 'active' },
          { key: 'sc-staff-hr', label: 'Staff & HR', icon: 'badge', path: '/super-admin/system-config/staff-hr', status: 'active' },
          { key: 'sc-finance', label: 'Finance', icon: 'payments', path: '/super-admin/system-config/finance', status: 'active' },
          { key: 'sc-communication', label: 'Communication', icon: 'campaign', path: '/super-admin/system-config/communication', status: 'active' },
          { key: 'sc-users-security', label: 'Users & Security', icon: 'admin_panel_settings', path: '/super-admin/system-config/users-security', status: 'active' },
          { key: 'sc-forms', label: 'Forms & Custom Fields', icon: 'dynamic_form', path: '/super-admin/system-config/forms', status: 'active' },
          { key: 'sc-documents', label: 'Documents & Templates', icon: 'description', path: '/super-admin/system-config/documents', status: 'active' },
          { key: 'sc-website', label: 'Website', icon: 'public', path: '/super-admin/system-config/website', status: 'active' },
          { key: 'sc-maintenance', label: 'System & Maintenance', icon: 'build', path: '/super-admin/system-config/maintenance', status: 'active' },
          { key: 'sc-integrations', label: 'Integrations', icon: 'integration_instructions', path: '/super-admin/system-config/integrations', status: 'active' },
        ],
      },
    ],
    // Primary mobile nav is the Dashboard's own 4 summary pages. Its other
    // 2 pages (Recent Activities, Notifications) plus the full
    // Administration/Finance/Operations/etc. hierarchy live behind More,
    // which opens the same full-nav drawer as the sidebar's tree.
    bottomNav: [
      { key: 'overview', label: 'Overview', icon: 'query_stats', path: '/super-admin', status: 'active' },
      { key: 'financial', label: 'Financial', icon: 'payments', path: '/super-admin/financial-summary', status: 'active' },
      { key: 'academic', label: 'Academic', icon: 'school', path: '/super-admin/academic-summary', status: 'active' },
      { key: 'operations', label: 'Operations', icon: 'monitoring', path: '/super-admin/operations-summary', status: 'active' },
      { key: 'more', label: 'More', icon: 'more_horiz', status: 'more' },
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
      { key: 'children', label: "Children's Profiles", icon: 'family_restroom', path: '/parent/children', status: 'active' },
      { key: 'attendance', label: 'Attendance', icon: 'event_available', path: '/parent/attendance', status: 'active' },
      { key: 'results', label: 'Results', icon: 'grading', path: '/parent/results', status: 'active' },
      { key: 'assignments', label: 'Assignments', icon: 'assignment', path: '/parent/assignments', status: 'active' },
      { key: 'timetable', label: 'Timetable', icon: 'calendar_today', path: '/parent/timetable', status: 'active' },
      { key: 'finance', label: 'School Fees', icon: 'payments', path: '/parent/finance', status: 'active' },
      { key: 'library', label: 'Library', icon: 'menu_book', path: '/parent/library', status: 'active' },
      { key: 'hostel', label: 'Hostel', icon: 'holiday_village', path: '/parent/hostel', status: 'active' },
      { key: 'transport', label: 'Transport', icon: 'directions_bus', path: '/parent/transport', status: 'active' },
      { key: 'messages', label: 'Teacher Communication', icon: 'forum', path: '/parent/messages', status: 'active' },
      { key: 'announcements', label: 'Announcements', icon: 'campaign', path: '/parent/announcements', status: 'active' },
      { key: 'events', label: 'Events / Calendar', icon: 'event', path: '/parent/events', status: 'active' },
      { key: 'fee-notifications', label: 'Fee Notifications', icon: 'notifications', path: '/parent/fee-notifications', status: 'active' },
      { key: 'settings', label: 'Settings', icon: 'settings', path: '/parent/settings', status: 'active' },
    ],
    bottomNav: [
      { key: 'dashboard', label: 'Home', icon: 'dashboard', path: '/parent', status: 'active' },
      { key: 'finance', label: 'Fees', icon: 'payments', path: '/parent/finance', status: 'active' },
      { key: 'children', label: 'Children', icon: 'family_restroom', path: '/parent/children', status: 'active' },
      { key: 'more', label: 'More', icon: 'more_horiz', status: 'more' },
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
