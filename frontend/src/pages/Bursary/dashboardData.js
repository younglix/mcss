export const collection = {
  collected: '₦142.8M',
  target: '₦180M',
  percent: 79,
  aheadDays: 4.2,
  term: 'Trinity Term',
};

export const outstandingBalances = {
  total: '₦37.2M',
  breakdown: [
    { label: 'JSS Classes', amount: '₦12.4M' },
    { label: 'SSS Classes', amount: '₦24.8M' },
  ],
  studentsRemaining: 142,
};

export const efficiencyByArm = [
  { label: 'JSS 1 (A-D)', percent: 92 },
  { label: 'JSS 2 (A-D)', percent: 85 },
  { label: 'JSS 3 (A-D)', percent: 78 },
  { label: 'SSS 1-3', percent: 64, tone: 'tertiary' },
];

export const actionRequired = {
  title: 'Action Required',
  message:
    'The "Mid-Term Balance Clearance" notices are scheduled to be dispatched via email and SMS tomorrow at 08:00 AM.',
  linkText: 'Manage Notifications',
};

export const transactions = [
  { ref: '#TRX-99201', student: 'Chukwudi Nwachukwu', class: 'SSS 2 Science', amount: '₦125,000', status: 'Cleared', date: 'Today, 10:42 AM' },
  { ref: '#TRX-99198', student: 'Aditiya O. Sharma', class: 'JSS 1 Blue', amount: '₦85,000', status: 'Cleared', date: 'Today, 09:15 AM' },
  { ref: '#TRX-99195', student: 'Blessing Effiong', class: 'SSS 3 Arts', amount: '₦210,000', status: 'Pending', date: 'Today, 08:30 AM' },
  { ref: '#TRX-99192', student: 'Ibrahim Abubakar', class: 'JSS 3 Gold', amount: '₦15,000', status: 'Cleared', date: 'Yesterday' },
  { ref: '#TRX-99189', student: 'Fatima Zahra', class: 'SSS 1 Science', amount: '₦145,000', status: 'Cleared', date: 'Yesterday' },
  { ref: '#TRX-99185', student: 'Tunde Adebayo', class: 'JSS 2 Green', amount: '₦40,000', status: 'Failed', date: 'Yesterday' },
];

export const transactionStatusTone = {
  Cleared: 'success',
  Pending: 'warning',
  Failed: 'error',
};
