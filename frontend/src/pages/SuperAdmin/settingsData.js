export const summaryCards = [
  { title: 'Access Control', tone: 'text-primary', icon: 'security', iconTone: 'bg-primary-container text-on-primary-container', note: '4 Active Global Roles', progress: 75 },
  { title: 'Brand Identity', tone: 'text-secondary', icon: 'palette', iconTone: 'bg-secondary-container text-on-secondary-container', note: 'Last updated 2 days ago', swatches: true },
  { title: 'System Integrity', tone: 'text-error', icon: 'history', iconTone: 'bg-error-container text-on-error-container', note: '12.4k Logs this month', status: 'OPTIMAL' },
];

export const roles = ['Super Admin', 'Principal', 'Finance Lead', 'Department Head', 'Staff/Teacher'];

export const permissionMatrix = [
  { module: 'User Management', access: ['full', 'full', 'none', 'none', 'none'] },
  { module: 'Financial Ledger', access: ['full', 'view', 'full', 'none', 'none'] },
  { module: 'Academic Curriculum', access: ['full', 'full', 'none', 'full', 'view'] },
  { module: 'Audit Logs', access: ['full', 'view', 'none', 'none', 'none'] },
];

export const auditLog = [
  { icon: 'person_add', tone: 'success', actor: 'Administrator', action: "added a new role 'Sub-Warden'", time: '12:45 PM', tag: 'SECURITY_EVENT', tagTone: 'success' },
  { icon: 'settings_brightness', tone: 'primary', actor: 'System', action: 'auto-archived logs from March 2024', time: '11:20 AM', tag: 'SYSTEM_MAINTENANCE', tagTone: 'primary' },
  { icon: 'warning', tone: 'error', actor: '', action: "Multiple failed login attempts detected for user 'finance_user_02'", time: '09:15 AM', tag: 'THREAT_ALERT', tagTone: 'error' },
  { icon: 'edit_square', tone: 'secondary', actor: 'Principal', action: 'updated school fee structure for Term 2', time: 'Yesterday', tag: 'FINANCE_CHANGE', tagTone: 'secondary' },
  { icon: 'school', tone: 'tertiary', actor: 'Curriculum Lead', action: "added 'Advanced Physics' to Academic Calendar", time: 'Yesterday', tag: 'ACADEMIC_LOG', tagTone: 'tertiary' },
];
