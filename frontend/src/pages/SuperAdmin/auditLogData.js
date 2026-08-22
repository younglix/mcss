// Sample rows shaped exactly like apps/audit/views.py's AuditLogSerializer /
// LoginHistorySerializer output — action strings match what the backend
// actually emits (apps/audit/services.py `log()` call sites).
export const auditLogs = [
  { id: 1, actorName: 'Super Admin', action: 'role.permissions_changed', targetType: 'Role', targetId: 'Teacher', ip: '41.58.12.204', time: '2 minutes ago' },
  { id: 2, actorName: 'Super Admin', action: 'user.roles_assigned', targetType: 'User', targetId: 'j.doherty@mcss.edu', ip: '41.58.12.204', time: '18 minutes ago' },
  { id: 3, actorName: 'Alicia Sterling', action: 'settings.updated', targetType: 'SystemSetting', targetId: 'payments.paystack.public_key', ip: '102.89.23.11', time: '1 hour ago' },
  { id: 4, actorName: 'Super Admin', action: 'config.session_set_current', targetType: 'AcademicSession', targetId: '2026/2027', ip: '41.58.12.204', time: '3 hours ago' },
  { id: 5, actorName: 'James Doherty', action: 'user.password_change', targetType: 'User', targetId: 'j.doherty@mcss.edu', ip: '154.113.6.90', time: 'Yesterday' },
  { id: 6, actorName: 'Super Admin', action: 'role.created', targetType: 'Role', targetId: 'Exam Officer', ip: '41.58.12.204', time: 'Yesterday' },
  { id: 7, actorName: 'System', action: 'user.sensitive_field_changed', targetType: 'User', targetId: 'b.kalu@mcss.edu', ip: '—', time: '2 days ago' },
  { id: 8, actorName: 'Super Admin', action: 'settings.bulk_updated', targetType: '—', targetId: '5 keys', ip: '41.58.12.204', time: '3 days ago' },
];

export const loginHistory = [
  { id: 1, user: 'admin@mountcarmel.edu', successful: true, ip: '41.58.12.204', device: 'Chrome on Windows', time: '2 minutes ago' },
  { id: 2, user: 'j.doherty@mcss.edu', successful: true, ip: '154.113.6.90', device: 'Safari on iPhone', time: '25 minutes ago' },
  { id: 3, user: 'unknown@mcss.edu', successful: false, ip: '185.220.101.4', device: 'curl/8.4.0', time: '1 hour ago' },
  { id: 4, user: 'a.sterling@mcss.edu', successful: true, ip: '102.89.23.11', device: 'Chrome on macOS', time: '4 hours ago' },
  { id: 5, user: 'a.sterling@mcss.edu', successful: false, ip: '102.89.23.11', device: 'Chrome on macOS', time: '4 hours ago' },
];
