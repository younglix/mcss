export const context = { academicYear: 'Academic Year 2023/24', term: 'Term 2', className: 'SS3 Science' };

export const stats = {
  totalStudents: 42,
  dataCompleteness: '92.4%',
  missingScores: 14,
  classAverage: '74.2%',
};

export const subjects = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Civics', 'Geography'];

const M = null; // missing score marker

export const students = [
  { name: 'Adebayo, Samuel', id: 'MCSS-2023-001', scores: [85, 78, 92, 88, 74, 81, 79] },
  { name: 'Chen, Wei', id: 'MCSS-2023-014', scores: [72, 84, M, 68, 91, 75, M] },
  { name: 'Ibrahim, Fatima', id: 'MCSS-2023-025', scores: [95, 91, 89, 94, 88, 92, 90] },
  { name: 'Musa, Daniel', id: 'MCSS-2023-038', scores: [M, 61, 54, 59, 63, 60, 58] },
  { name: 'Okonkwo, Ifeanyi', id: 'MCSS-2023-042', scores: [78, 82, 85, 80, 77, 84, 81] },
];

export function averageFor(scores) {
  if (scores.includes(null)) return null;
  return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
}

export const lastSynced = 'Last synchronized: 12 minutes ago by Head of Department (Science)';
