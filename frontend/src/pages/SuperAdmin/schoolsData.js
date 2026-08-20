export const stats = [
  { label: 'Total Schools', value: '12' },
  { label: 'Active Enrollment', value: '8,420' },
  { label: 'System Health', value: '99.8%', tone: 'text-secondary' },
  { label: 'Group Revenue', value: '$4.2M' },
];

export const branches = [
  {
    name: 'Mount Carmel - Main Campus',
    branchId: 'MC-001-HQ',
    initials: 'MC',
    tone: 'bg-primary',
    status: 'Active',
    admin: 'Dr. Julian Thorne',
    students: '2,150',
    statusIcon: 'check_circle',
    statusText: 'Fully Operational',
    statusTone: 'text-secondary',
    lastField: ['Last Sync', '2 minutes ago'],
  },
  {
    name: 'St. Vincent Branch',
    branchId: 'MC-002-SV',
    initials: 'SV',
    tone: 'bg-secondary',
    status: 'Maintenance',
    admin: 'Sarah Jenkins, M.Ed',
    students: '1,420',
    statusIcon: 'build',
    statusText: 'Data Migration',
    statusTone: 'text-error',
    lastField: ['Scheduled End', 'Today, 18:00'],
  },
  {
    name: 'Lakeview Academy',
    branchId: 'MC-003-LW',
    initials: 'LW',
    tone: 'bg-primary-container',
    status: 'Active',
    admin: 'Robert McAlister',
    students: '980',
    statusIcon: 'check_circle',
    statusText: 'Operational',
    statusTone: 'text-secondary',
    lastField: ['Last Sync', '15 minutes ago'],
  },
];
export const branchStatusTone = { Active: 'success', Maintenance: 'secondary' };

export const auditLog = [
  { time: 'Oct 24, 2024 10:45', action: 'Branding Update', by: 'Super Admin (System)', entity: 'Main Campus', status: 'Success' },
  { time: 'Oct 24, 2024 09:12', action: 'Admin Re-assignment', by: 'Master Controller', entity: 'St. Vincent', status: 'Success' },
  { time: 'Oct 23, 2024 22:30', action: 'Maintenance Mode On', by: 'Automated Scheduler', entity: 'Lakeview Academy', status: 'Active' },
];
export const auditStatusTone = { Success: 'text-secondary', Active: 'text-error' };
