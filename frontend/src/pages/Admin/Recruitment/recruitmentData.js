export const stats = [
  { icon: 'work', label: 'Total Openings', value: '12', note: '2 active this week' },
  { icon: 'groups', label: 'Total Applicants', value: '148', note: '+15% from last month' },
  { icon: 'event', label: 'Interviews Set', value: '24', note: '8 scheduled today' },
  { icon: 'timer', label: 'Time to Hire', value: '18d', note: 'Target: < 21 days' },
];

export const columns = [
  {
    key: 'applied',
    label: 'Applied',
    count: 42,
    dotTone: 'bg-secondary-container',
    cards: [
      { name: 'Michael Henderson', role: 'Lead Physics Teacher', tag: 'Internal', meta: 'Applied 2h ago', initials: 'JD' },
      { name: "Sarah O'Connor", role: 'Administrative Assistant', tag: 'External', meta: 'Applied 5h ago', initials: 'MS' },
    ],
  },
  {
    key: 'interview',
    label: 'Interview',
    count: 18,
    dotTone: 'bg-primary-container',
    cards: [
      {
        name: 'Dr. Alistair Vance',
        role: 'Head of Mathematics',
        note: 'Panel Interview 2 — Today @ 14:30 in Boardroom A',
        urgent: true,
      },
    ],
  },
  {
    key: 'offered',
    label: 'Offered',
    count: 5,
    dotTone: 'bg-tertiary-container',
    cards: [{ name: 'Eleanor Rigby', role: 'School Counselor', status: 'Pending Response', expires: 'Exp. Nov 24, 2024' }],
  },
  { key: 'rejected', label: 'Rejected', count: 83, dotTone: 'bg-outline', archive: true },
];

export const jobPostings = [
  { title: 'Lead Physics Teacher', meta: 'Full-Time • On-Campus', department: 'Science Department', applicants: 24, newApplicants: 3, status: 'Active', posted: 'Oct 12, 2024' },
  { title: 'Head of Mathematics', meta: 'Executive • Full-Time', department: 'Administration', applicants: 12, newApplicants: 0, status: 'Active', posted: 'Oct 05, 2024' },
  { title: 'School Counselor', meta: 'Full-Time • Student Welfare', department: 'Wellness Dept.', applicants: 48, newApplicants: 12, status: 'Offer Sent', posted: 'Sept 28, 2024' },
];

export const jobStatusTone = { Active: 'success', 'Offer Sent': 'warning' };
