// Mirrors apps/configuration/models.py — a single-school ERP, not a
// multi-tenant/multi-branch one, so this replaces the old branch-management
// mock with the school's actual configuration surface.
export const schoolProfile = {
  name: 'Mount Carmel Secondary School',
  motto: 'Scientia et Virtus',
  address: '12 Carmel Drive, Institutional Hill, Victoria Island Annex',
  phone: '+234 800 123 4567',
  email: 'admissions@mountcarmel.edu.ng',
};

export const sessions = [
  {
    id: 1,
    name: '2026/2027',
    startDate: 'Sep 8, 2026',
    endDate: 'Jul 17, 2027',
    isCurrent: true,
    terms: [
      { id: 1, name: 'First', startDate: 'Sep 8, 2026', endDate: 'Dec 12, 2026', isCurrent: true },
      { id: 2, name: 'Second', startDate: 'Jan 5, 2027', endDate: 'Apr 2, 2027', isCurrent: false },
      { id: 3, name: 'Third', startDate: 'Apr 20, 2027', endDate: 'Jul 17, 2027', isCurrent: false },
    ],
  },
  {
    id: 2,
    name: '2025/2026',
    startDate: 'Sep 9, 2025',
    endDate: 'Jul 18, 2026',
    isCurrent: false,
    terms: [
      { id: 4, name: 'First', startDate: 'Sep 9, 2025', endDate: 'Dec 13, 2025', isCurrent: false },
      { id: 5, name: 'Second', startDate: 'Jan 6, 2026', endDate: 'Apr 3, 2026', isCurrent: false },
      { id: 6, name: 'Third', startDate: 'Apr 21, 2026', endDate: 'Jul 18, 2026', isCurrent: false },
    ],
  },
];

export const classes = [
  { id: 1, name: 'JSS 1', levelOrder: 1, arms: ['A', 'B', 'C'] },
  { id: 2, name: 'JSS 2', levelOrder: 2, arms: ['A', 'B'] },
  { id: 3, name: 'JSS 3', levelOrder: 3, arms: ['A', 'B'] },
  { id: 4, name: 'SS 1', levelOrder: 4, arms: ['Science', 'Arts', 'Commercial'] },
  { id: 5, name: 'SS 2', levelOrder: 5, arms: ['Science', 'Arts', 'Commercial'] },
  { id: 6, name: 'SS 3', levelOrder: 6, arms: ['Science', 'Arts', 'Commercial'] },
];

export const gradeScale = [
  { name: 'A1', minScore: 75, maxScore: 100, remark: 'Excellent', gradePoint: 5.0 },
  { name: 'B2', minScore: 70, maxScore: 74, remark: 'Very Good', gradePoint: 4.5 },
  { name: 'B3', minScore: 65, maxScore: 69, remark: 'Good', gradePoint: 4.0 },
  { name: 'C4', minScore: 60, maxScore: 64, remark: 'Credit', gradePoint: 3.5 },
  { name: 'C5', minScore: 55, maxScore: 59, remark: 'Credit', gradePoint: 3.0 },
  { name: 'C6', minScore: 50, maxScore: 54, remark: 'Credit', gradePoint: 2.5 },
  { name: 'D7', minScore: 45, maxScore: 49, remark: 'Pass', gradePoint: 2.0 },
  { name: 'E8', minScore: 40, maxScore: 44, remark: 'Pass', gradePoint: 1.0 },
  { name: 'F9', minScore: 0, maxScore: 39, remark: 'Fail', gradePoint: 0.0 },
];

export const feeCategories = [
  { name: 'Tuition', isRecurring: true },
  { name: 'Development Levy', isRecurring: true },
  { name: 'ICT & Laboratory', isRecurring: true },
  { name: 'Boarding', isRecurring: true },
  { name: 'Admission Fee', isRecurring: false },
  { name: 'WAEC/NECO Registration', isRecurring: false },
];
