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
    // Exact 9-section IA as specified — every item below must exist, in
    // this order, with these exact labels. Items with a real page behind
    // them are 'active'; everything else is 'planned' (disabled, "Soon")
    // until its own build phase, per the incremental build-one-at-a-time
    // plan. Intentional duplicates (Reception, Transport, Hostel, Mess,
    // Roles & Permissions) keep distinct `key`s but the same `path` where
    // a page already exists, so both entries stay in sync automatically.
    sidebarNav: [
      {
        key: 'dashboard', label: 'Dashboard', icon: 'dashboard',
        children: [
          { key: 'dashboard-overview', label: 'Overview / Statistics', icon: 'query_stats', path: '/super-admin', status: 'active' },
          { key: 'dashboard-financial', label: 'Financial Summary', icon: 'payments', path: '/super-admin/financial-summary', status: 'active' },
          { key: 'dashboard-academic', label: 'Academic Summary', icon: 'school', path: '/super-admin/academic-summary', status: 'active' },
          { key: 'dashboard-operations', label: 'Operations Summary', icon: 'monitoring', path: '/super-admin/operations-summary', status: 'active' },
          { key: 'dashboard-activities', label: 'Recent Activities', icon: 'history', path: '/super-admin#recent-activities', status: 'active' },
          { key: 'dashboard-notifications', label: 'Notifications', icon: 'notifications', path: '/super-admin#notifications', status: 'active' },
        ],
      },
      {
        key: 'administration', label: 'Administration', icon: 'corporate_fare',
        children: [
          { key: 'admin-school-configuration', label: 'School Configuration', icon: 'domain', path: '/super-admin/configuration', status: 'active' },
          { key: 'admin-academic-sessions-terms', label: 'Academic Session & Terms', icon: 'calendar_month', path: '/super-admin/administration/academic-session-terms', status: 'planned' },
          { key: 'admin-classes-arms', label: 'Classes & Arms', icon: 'class', path: '/super-admin/administration/classes-arms', status: 'planned' },
          { key: 'admin-departments', label: 'Departments', icon: 'apartment', path: '/super-admin/administration/departments', status: 'planned' },
          { key: 'admin-staff-management', label: 'Staff Management', icon: 'badge', path: '/super-admin/staff', status: 'active' },
          { key: 'admin-user-management', label: 'User Management', icon: 'manage_accounts', path: '/super-admin/administration/user-management', status: 'planned' },
          { key: 'admin-roles-permissions', label: 'Roles & Permissions', icon: 'admin_panel_settings', path: '/super-admin/roles', status: 'active' },
          { key: 'admin-reception', label: 'Reception', icon: 'support_agent', path: '/super-admin/administration/reception', status: 'planned' },
          { key: 'admin-communication', label: 'Communication', icon: 'forum', path: '/super-admin/administration/communication', status: 'planned' },
          { key: 'admin-calendar', label: 'Calendar', icon: 'event', path: '/super-admin/administration/calendar', status: 'planned' },
          { key: 'admin-website-cms', label: 'Website / CMS', icon: 'language', path: '/super-admin/administration/website-cms', status: 'planned' },
        ],
      },
      {
        key: 'academic-management', label: 'Academic Management', icon: 'auto_stories',
        children: [
          { key: 'academic-students', label: 'Students', icon: 'school', path: '/super-admin/academic/students', status: 'planned' },
          { key: 'academic-teachers', label: 'Teachers', icon: 'groups', path: '/super-admin/academic/teachers', status: 'planned' },
          { key: 'academic-subjects', label: 'Subjects', icon: 'subject', path: '/super-admin/academic/subjects', status: 'planned' },
          { key: 'academic-classes', label: 'Classes', icon: 'class', path: '/super-admin/academic/classes', status: 'planned' },
          { key: 'academic-timetable', label: 'Timetable', icon: 'schedule', path: '/super-admin/academic/timetable', status: 'planned' },
          { key: 'academic-attendance', label: 'Attendance', icon: 'fact_check', path: '/super-admin/academic/attendance', status: 'planned' },
          { key: 'academic-exams', label: 'Exams', icon: 'quiz', path: '/super-admin/academic/exams', status: 'planned' },
          { key: 'academic-results', label: 'Results / Marksheets', icon: 'grading', path: '/super-admin/academic/results', status: 'planned' },
          { key: 'academic-assignments', label: 'Assignments', icon: 'assignment', path: '/super-admin/academic/assignments', status: 'planned' },
          { key: 'academic-promotion', label: 'Promotion', icon: 'trending_up', path: '/super-admin/academic/promotion', status: 'planned' },
          { key: 'academic-reports', label: 'Academic Reports', icon: 'summarize', path: '/super-admin/academic/reports', status: 'planned' },
        ],
      },
      {
        key: 'finance', label: 'Finance', icon: 'account_balance_wallet',
        children: [
          { key: 'finance-school-fees', label: 'School Fees', icon: 'payments', path: '/super-admin/finance/school-fees', status: 'planned' },
          { key: 'finance-fee-structures', label: 'Fee Structures', icon: 'request_quote', path: '/super-admin/finance/fee-structures', status: 'planned' },
          { key: 'finance-invoices', label: 'Invoices', icon: 'receipt_long', path: '/super-admin/finance/invoices', status: 'planned' },
          { key: 'finance-payments', label: 'Payments', icon: 'point_of_sale', path: '/super-admin/finance/payments', status: 'planned' },
          { key: 'finance-receipts', label: 'Receipts', icon: 'receipt', path: '/super-admin/finance/receipts', status: 'planned' },
          { key: 'finance-expenses', label: 'Expenses', icon: 'trending_down', path: '/super-admin/finance/expenses', status: 'planned' },
          { key: 'finance-payroll', label: 'Payroll', icon: 'work', path: '/super-admin/finance/payroll', status: 'planned' },
          { key: 'finance-reports', label: 'Financial Reports', icon: 'bar_chart', path: '/super-admin/finance/reports', status: 'planned' },
        ],
      },
      {
        key: 'student-services', label: 'Student Services', icon: 'family_restroom',
        children: [
          { key: 'services-library', label: 'Library', icon: 'menu_book', path: '/super-admin/student-services/library', status: 'planned' },
          { key: 'services-hostel', label: 'Hostel', icon: 'holiday_village', path: '/super-admin/student-services/hostel', status: 'planned' },
          { key: 'services-transport', label: 'Transport', icon: 'directions_bus', path: '/super-admin/student-services/transport', status: 'planned' },
          { key: 'services-mess', label: 'School Meals / Mess', icon: 'restaurant', path: '/super-admin/student-services/mess', status: 'planned' },
          { key: 'services-activities', label: 'Activities', icon: 'sports_soccer', path: '/super-admin/student-services/activities', status: 'planned' },
          { key: 'services-resources', label: 'Student Resources', icon: 'folder_shared', path: '/super-admin/student-services/resources', status: 'planned' },
          { key: 'services-health', label: 'Health / Medical Records', icon: 'medical_services', path: '/super-admin/student-services/health', status: 'planned' },
        ],
      },
      {
        key: 'operations', label: 'Operations', icon: 'engineering',
        children: [
          { key: 'ops-hr', label: 'HR', icon: 'badge', path: '/super-admin/operations/hr', status: 'planned' },
          { key: 'ops-recruitment', label: 'Recruitment', icon: 'person_search', path: '/super-admin/operations/recruitment', status: 'planned' },
          { key: 'ops-inventory', label: 'Inventory', icon: 'inventory_2', path: '/super-admin/operations/inventory', status: 'planned' },
          { key: 'ops-assets', label: 'Assets', icon: 'warehouse', path: '/super-admin/operations/assets', status: 'planned' },
          { key: 'ops-reception', label: 'Reception', icon: 'support_agent', path: '/super-admin/administration/reception', status: 'planned' },
          { key: 'ops-transport', label: 'Transport', icon: 'directions_bus', path: '/super-admin/student-services/transport', status: 'planned' },
          { key: 'ops-hostel', label: 'Hostel', icon: 'holiday_village', path: '/super-admin/student-services/hostel', status: 'planned' },
          { key: 'ops-mess', label: 'Mess', icon: 'restaurant', path: '/super-admin/student-services/mess', status: 'planned' },
        ],
      },
      {
        key: 'communication', label: 'Communication & Public Website', icon: 'campaign',
        children: [
          { key: 'comm-notices', label: 'Notices / Announcements', icon: 'campaign', path: '/super-admin/communication/notices', status: 'planned' },
          { key: 'comm-sms', label: 'SMS', icon: 'sms', path: '/super-admin/communication/sms', status: 'planned' },
          { key: 'comm-email', label: 'Email', icon: 'mail', path: '/super-admin/communication/email', status: 'planned' },
          { key: 'comm-push', label: 'Push Notifications', icon: 'notifications_active', path: '/super-admin/communication/push', status: 'planned' },
          { key: 'comm-parent', label: 'Parent Communication', icon: 'family_restroom', path: '/super-admin/communication/parent', status: 'planned' },
          { key: 'comm-website', label: 'Website', icon: 'public', path: '/super-admin/communication/website', status: 'planned' },
          { key: 'comm-gallery', label: 'Gallery', icon: 'photo_library', path: '/super-admin/communication/gallery', status: 'planned' },
          { key: 'comm-events', label: 'Events', icon: 'event_available', path: '/super-admin/communication/events', status: 'planned' },
        ],
      },
      {
        key: 'configuration-engine', label: 'Configuration', icon: 'tune',
        children: [
          { key: 'config-name-logo', label: 'School Name & Logo', icon: 'domain', path: '/super-admin/configuration', status: 'active' },
          { key: 'config-address-contact', label: 'Address & Contact', icon: 'contact_mail', path: '/super-admin/configuration', status: 'active' },
          { key: 'config-sessions', label: 'Academic Sessions', icon: 'calendar_month', path: '/super-admin/configuration', status: 'active' },
          { key: 'config-grading', label: 'Grading System', icon: 'grading', path: '/super-admin/configuration', status: 'active' },
          { key: 'config-fee-categories', label: 'Fee Categories', icon: 'sell', path: '/super-admin/configuration', status: 'active' },
          { key: 'config-classes-departments', label: 'Classes & Departments', icon: 'class', path: '/super-admin/configuration', status: 'active' },
          { key: 'config-user-roles', label: 'User Roles', icon: 'admin_panel_settings', path: '/super-admin/roles', status: 'active' },
          { key: 'config-permissions', label: 'Permissions', icon: 'verified_user', path: '/super-admin/roles', status: 'active' },
          { key: 'config-sms-settings', label: 'SMS Settings', icon: 'sms', path: '/super-admin/settings', status: 'active' },
          { key: 'config-email-settings', label: 'Email Settings', icon: 'mail', path: '/super-admin/settings', status: 'active' },
          { key: 'config-payment-gateway', label: 'Payment Gateway', icon: 'credit_card', path: '/super-admin/settings', status: 'active' },
          { key: 'config-notification-settings', label: 'Notification Settings', icon: 'notifications_active', path: '/super-admin/settings', status: 'active' },
          { key: 'config-result-settings', label: 'Result Settings', icon: 'grading', path: '/super-admin/settings', status: 'active' },
          { key: 'config-numbering-formats', label: 'Numbering Formats', icon: 'tag', path: '/super-admin/settings', status: 'active' },
        ],
      },
      {
        key: 'system', label: 'System', icon: 'settings_applications',
        children: [
          { key: 'system-roles-permissions', label: 'Roles & Permissions', icon: 'admin_panel_settings', path: '/super-admin/roles', status: 'active' },
          { key: 'system-custom-forms', label: 'Custom Forms (Form Builder)', icon: 'dynamic_form', path: '/super-admin/system/custom-forms', status: 'planned' },
          { key: 'system-audit-logs', label: 'Audit Logs', icon: 'history', path: '/super-admin/audit', status: 'active' },
          { key: 'system-login-history', label: 'Login History', icon: 'login', path: '/super-admin/audit', status: 'active' },
          { key: 'system-backup-security', label: 'Backup & Security', icon: 'backup', path: '/super-admin/system/backup-security', status: 'planned' },
          { key: 'system-settings', label: 'System Settings', icon: 'settings', path: '/super-admin/settings', status: 'active' },
        ],
      },
    ],
    // Primary mobile nav is the Dashboard's own 4 summary pages (its
    // 2 remaining sections — Recent Activities, Notifications — stay
    // in-page on Overview; the full Administration/Finance/Operations/etc.
    // hierarchy lives behind More, which opens the same full-nav drawer as
    // the sidebar's tree).
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
