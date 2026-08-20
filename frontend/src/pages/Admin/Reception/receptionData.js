export const stats = [
  { icon: 'group', label: 'Active Visitors', value: '12', helper: 'Currently on campus' },
  { icon: 'analytics', label: 'Daily Total', value: '48', helper: '+5% from yesterday' },
  { icon: 'contact_support', label: 'Open Inquiries', value: '06', helper: 'Awaiting response' },
];
export const securityStatus = { label: 'Security Status', value: 'SECURE', helper: 'All check-outs clear' };

export const visitorLog = [
  { name: 'Robert Chambers', purpose: 'Parent-Teacher Meet', timeIn: '08:45 AM', timeOut: '--', host: 'Ms. Elena Vance', status: 'Active' },
  { name: 'Cynthia Morgan', purpose: 'Vendor Delivery', timeIn: '09:12 AM', timeOut: '10:05 AM', host: 'Admin Office', status: 'Checked Out' },
  { name: 'Thomas Wright', purpose: 'Admission Query', timeIn: '10:30 AM', timeOut: '--', host: 'Mr. Julian Croft', status: 'Active' },
  { name: 'Sarah Jenkins', purpose: 'Alumni Visit', timeIn: '11:15 AM', timeOut: '--', host: 'Public Relations', status: 'Active' },
  { name: 'David Foster', purpose: 'Maintenance', timeIn: '07:30 AM', timeOut: '09:45 AM', host: 'Facilities Dept.', status: 'Checked Out' },
];
export const visitorStatusTone = { Active: 'success', 'Checked Out': 'secondary' };
export const totalVisitors = 48;

export const inquiries = [
  { priority: 'High Priority', tone: 'error', time: '20m ago', title: 'Late Admission Process', body: 'Inquiry regarding Grade 10 transfer requirements for the second semester starting January.', by: 'Margaret Hsu' },
  { priority: 'General', tone: 'secondary', time: '1h ago', title: 'Bus Route Expansion', body: 'Parent requesting information on new bus routes planned for the western residential district.', by: 'Arthur King' },
  { priority: 'General', tone: 'secondary', time: '3h ago', title: 'Winter Gala Tickets', body: 'Inquiry about bulk ticket purchases for the upcoming Winter Charity Gala event.', by: 'Alumni Assoc.' },
];
