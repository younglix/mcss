export const roles = ['All Roles', 'Teacher', 'Bursary', 'Library', 'Admin'];
export const schools = ['All Schools', 'MCSS Main Campus', 'MCSS Tech Annex'];

export const staff = [
  { name: 'James Doherty', email: 'j.doherty@mcss.edu', id: 'MC-2024-001', role: 'Head Teacher', dept: 'Main Campus / Science', status: 'Active', initials: 'JD', tone: 'bg-secondary-container text-on-secondary-container' },
  { name: 'Alicia Sterling', email: 'a.sterling@mcss.edu', id: 'MC-2024-042', role: 'Bursary', dept: 'Finance Office', status: 'Active', initials: 'AS', tone: 'bg-tertiary-container text-on-tertiary-container' },
  { name: 'Benjamin Kalu', email: 'b.kalu@mcss.edu', id: 'MC-2023-112', role: 'Librarian', dept: 'Information Center', status: 'Inactive', initials: 'BK', tone: 'bg-surface-container-high text-outline' },
  { name: 'Marcus Webb', email: 'm.webb@mcss.edu', id: 'MC-2024-088', role: 'Teacher', dept: 'Annex / Arts', status: 'Active', initials: 'MW', tone: 'bg-tertiary text-on-tertiary' },
];
export const staffStatusTone = { Active: 'success', Inactive: 'secondary' };
export const totalStaff = 128;

export const rolePermissions = [
  { text: 'Can view student profiles', allowed: true },
  { text: 'Can input grade results', allowed: true },
  { text: 'Cannot access financial records', allowed: false },
];
