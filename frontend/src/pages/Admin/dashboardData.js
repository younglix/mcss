export const term = 'Term 2, Week 8 status report (2024)';

export const stats = [
  { key: 'students', icon: 'group', iconTone: 'primary', label: 'Total Students', value: '1,248', delta: { direction: 'up', text: '+4.2%' }, progress: { percent: 85 } },
  { key: 'fees', icon: 'payments', iconTone: 'tertiary', label: 'Fees Collected', value: '₦84.2M', delta: { direction: 'down', text: '-1.5%' }, progress: { percent: 72 } },
  { key: 'attendance', icon: 'event_available', iconTone: 'secondary', label: 'Avg Attendance', value: '94.8%', delta: { direction: 'up', text: '+0.8%' }, progress: { percent: 94 } },
];

export const performanceTrend = {
  weeks: ['WK 1', 'WK 4', 'WK 8'],
  sciencePath: 'M0,200 Q150,150 300,180 T600,100 T1000,50',
  artsPath: 'M0,250 Q200,220 400,240 T700,180 T1000,120',
};

const HIGH = 3;
const MED = 2;
const LOW = 1;
const NONE = 0;
export const attendanceHeatmap = [
  HIGH, MED, MED, HIGH, LOW, NONE, NONE,
  MED, HIGH, LOW, HIGH, MED, NONE, NONE,
  HIGH, HIGH, MED, MED, HIGH, NONE, NONE,
  LOW, MED, HIGH, HIGH, MED, NONE, NONE,
];
export const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const recentAdmissions = [
  { name: 'Owolabi, Samuel', className: 'SS3 Gold', status: 'Verified' },
  { name: 'Chukwu, Amaka', className: 'SS2 Blue', status: 'Pending' },
  { name: 'Adeyemi, Tunde', className: 'JS1 Green', status: 'Verified' },
];

export const facultySpotlight = [
  {
    name: 'Dr. Helena Vance',
    role: 'Physics Head',
    badge: 'Top',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBYRMlXGT15o4huhIj1RUFwxhDXaWk6L2TzYRrJWYFupIUO9-GIqseObv7zHGr7pH8eiSvu_fihNLY_RJcFJ8BDb3RfgurarS5x-BR5lRm3nybqlgVQDl6HOijnYB6mPa0mSqjOw1UjJoDZnkfyZ-47uS1OnWYsya_mX7sVgi2anbNoemPpG_ZiIiL52tm6ZsZC1fdDxPB-Z9IoUiu9eJbEH__GYcR902im7DMlomNBqTg1wyE3Gp4nWzV99Y3CvIvvRNr5lKrSc3yx',
  },
  {
    name: 'Mrs. Sarah Okon',
    role: 'Library',
    badge: 'New',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-qz2_JEJ_AWeLWYHlOWmv-l3Z7l2WheP0E5DBWIWxrYcV7pQ47i3vDWEcrMMClurF9dbVgaTwNiYca-1Zf-ZdtIN8AFWGS0oVaVrOzta_8FDTu-UYGuY2tCbfoiWh3OCYRnQxii9MEjRhDUrjHM3bcgtFKUq8BquEu40KJwsJGz-YkH71XGC_wYeDWYt-Uyl941DnrXUeXkD4DSsV0Jhfa0M9lfLtJ0IyYYL_Nfqmp3IgiSXWWjB85N_Z570Yp7BwzpBmEZn9SGQZ',
  },
];
