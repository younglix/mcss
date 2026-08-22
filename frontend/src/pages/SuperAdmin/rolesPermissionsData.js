// Mirrors apps/rbac/constants.py — the master permission registry and the
// default role bundles seeded by `python manage.py seed_rbac`.
export const permissionRegistry = {
  students: ['view', 'create', 'edit', 'delete', 'export'],
  attendance: ['view', 'create', 'edit'],
  results: ['view', 'enter', 'edit', 'approve', 'publish'],
  fees: ['view', 'create', 'collect', 'refund', 'waive'],
  staff: ['view', 'create', 'edit', 'delete'],
  payroll: ['view', 'run', 'approve'],
  config: ['view', 'edit'],
  settings: ['view', 'edit'],
  roles: ['view', 'create', 'edit', 'delete', 'assign'],
  users: ['view', 'create', 'edit', 'delete', 'reset_password'],
  audit: ['view'],
  dashboard: ['view'],
};

export const roles = [
  {
    slug: 'principal',
    name: 'Principal',
    description: 'Full academic and operational oversight for the school.',
    isSystem: true,
    permissions: Object.entries(permissionRegistry).flatMap(([module, actions]) => actions.map((a) => `${module}.${a}`)),
  },
  {
    slug: 'teacher',
    name: 'Teacher',
    description: 'Classroom-facing staff: attendance and results entry.',
    isSystem: true,
    permissions: [
      'students.view', 'attendance.view', 'attendance.create', 'attendance.edit',
      'results.view', 'results.enter', 'results.edit',
    ],
  },
  {
    slug: 'accountant',
    name: 'Accountant',
    description: 'Bursary staff: fee collection and financial records.',
    isSystem: true,
    permissions: ['students.view', 'fees.view', 'fees.create', 'fees.collect', 'fees.refund', 'fees.waive', 'dashboard.view'],
  },
  {
    slug: 'hr',
    name: 'HR',
    description: 'Staff records and payroll administration.',
    isSystem: true,
    permissions: ['staff.view', 'staff.create', 'staff.edit', 'payroll.view', 'payroll.run'],
  },
  {
    slug: 'student',
    name: 'Student',
    description: 'Self-service access to own academic records.',
    isSystem: true,
    permissions: ['results.view', 'attendance.view'],
  },
  {
    slug: 'parent',
    name: 'Parent',
    description: "Self-service access to their children's records.",
    isSystem: true,
    permissions: ['results.view', 'attendance.view', 'fees.view'],
  },
];

export const superAdminNote = 'Super Admin bypasses this registry entirely — every permission check returns true for that one account, by design.';
