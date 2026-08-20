export const stats = {
  schools: { value: '48', note: '+2 this month', progress: 75 },
  students: { value: '32,490', note: '+1.4k increase', progress: 85 },
  admissions: { value: '124', note: 'View applicant queue' },
  latency: { value: '14ms', note: 'Stable', bars: [40, 60, 55, 80, 30, 50] },
};

export const topSchools = [
  { name: 'St. Jude Academy', location: 'Lagos Main Campus', students: 1240, staff: 82, status: 'Active', initials: 'SJ', tone: 'bg-secondary-container text-on-secondary-container' },
  { name: 'Holy Mary Institute', location: 'Central Abuja', students: 890, staff: 45, status: 'Active', initials: 'HM', tone: 'bg-tertiary-container text-on-tertiary-container' },
  { name: 'Mount Carmel North', location: 'Port Harcourt', students: 2100, staff: 114, status: 'Maintenance', initials: 'MC', tone: 'bg-primary-container text-on-primary-container' },
];
export const schoolStatusTone = { Active: 'success', Maintenance: 'warning' };
export const totalInstitutions = 48;

export const activityFeed = [
  { icon: 'security', tone: 'primary', actor: 'System Root', text: 'updated platform-wide security protocol.', time: '2 minutes ago', quote: 'TLS 1.3 enforced for all child school domains.' },
  { icon: 'person_add', tone: 'secondary', actor: 'St. Jude Academy', text: 'added 45 new student enrollments.', time: '1 hour ago' },
  { icon: 'warning', tone: 'tertiary', actor: 'System Alert', text: 'High traffic detected at Admissions Portal.', time: '3 hours ago' },
  { icon: 'dns', tone: 'neutral', actor: 'Cloud Backup', text: 'completed successfully for all 48 nodes.', time: '6 hours ago' },
];

export const growth = {
  heading: 'Institutional Growth Analysis',
  body: "Our platform's predictive modeling suggests a 22% increase in cross-campus student mobility for the upcoming academic session. Manage resources effectively with real-time data sync across all regional centers.",
  statValue: '+15.8%',
  statLabel: 'Global Academic Performance Uplift',
};
