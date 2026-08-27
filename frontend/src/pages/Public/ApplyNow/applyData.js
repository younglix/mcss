export const sessions = [
  { key: '2024-2025', label: '2024/2025 Session', note: 'Regular Admission' },
  { key: '2025-2026', label: '2025/2026 Session', note: 'Advance Registration' },
];

export const levels = [
  { key: 'secondary', label: 'Secondary School', note: 'JSS1 – SSS3' },
  { key: 'primary', label: 'Primary School', note: 'Primary 1 – 6' },
];

export const processSteps = [
  { icon: 'description', title: '1. Complete Form', body: 'Provide accurate personal and academic information.' },
  { icon: 'upload_file', title: '2. Upload Documents', body: 'Attach birth certificate and previous school reports.' },
  { icon: 'payments', title: '3. Pay Fee', body: 'Securely process the non-refundable application fee.' },
];

export const requiredDocs = [
  'Certified copy of Birth Certificate or Passport.',
  'Previous two years of academic transcripts or report cards.',
  'Two recent passport-sized photographs (Digital).',
  'Letter of recommendation from the previous School Principal.',
];

export const entryLevels = [
  { value: 'js1', label: 'Junior Secondary 1 (Grade 7)' },
  { value: 'js2', label: 'Junior Secondary 2 (Grade 8)' },
  { value: 'js3', label: 'Junior Secondary 3 (Grade 9)' },
  { value: 'ss1', label: 'Senior Secondary 1 (Grade 10)' },
  { value: 'ss2', label: 'Senior Secondary 2 (Grade 11)' },
];

export const uploadSlots = [
  {
    key: 'birth_cert',
    icon: 'cake',
    tone: 'bg-primary/10 text-primary',
    title: 'Birth Certificate',
    body: 'Original or certified copy indicating date and place of birth.',
    status: 'verified',
    fileName: 'birth_cert_smith_john.pdf',
    fileMeta: 'Uploaded June 12, 2024 • 1.2 MB',
  },
  {
    key: 'photo',
    icon: 'portrait',
    tone: 'bg-secondary/10 text-secondary',
    title: 'Passport Photograph',
    body: 'Recent high-resolution photo with white background. PNG or JPG preferred.',
    status: 'empty',
  },
  {
    key: 'academic_records',
    icon: 'auto_stories',
    tone: 'bg-tertiary-container/40 text-on-tertiary-container',
    title: 'Academic Records',
    body: 'Transcripts, school reports, or transfer certificates from the last academic year.',
    status: 'empty',
  },
];

export const applicantSummary = {
  fullName: 'Dominic Savio Okon',
  dob: '14 October 2011',
  nationality: 'Nigerian',
  applyingFor: 'JS1 (Year 7) - Boarding',
  address: '12 Catholic Mission Street, Lagos Island, Lagos State',
  candidateId: '2024/098',
  guardian: { name: 'Mrs. Mary Okon', phone: '+234 801 234 5678', email: 'm.okon@example.com' },
  documents: [
    { name: 'Birth_Certificate.pdf', meta: '2.4 MB • Verified' },
    { name: 'Last_School_Report.pdf', meta: '1.8 MB • Verified' },
    { name: 'Medical_Fitness.pdf', meta: '3.1 MB • Verified' },
    { name: 'Baptismal_Certificate.pdf', meta: '1.2 MB • Verified' },
  ],
};

export const nextSteps = [
  { status: 'current', title: 'Document Verification', body: 'Our registrar is currently verifying your transcripts and submitted documents for authenticity.' },
  { status: 'pending', title: 'Entrance Assessment', body: 'Once verified, you will receive an invitation via email to schedule the entrance aptitude test.' },
  { status: 'pending', title: 'Formal Interview', body: 'Final candidates will be invited for a personal interview with the academic dean.' },
];

export const referenceNumber = 'APP-2024-8294';

export const statusResult = {
  name: 'Julian S. Montgomery',
  status: 'Under Review',
  refId: 'MCSS-2024-8812',
  gradeLevel: 'Grade 9 Entry',
  term: 'Fall Semester 2024',
  submissionDate: 'Oct 12, 2023',
  actionRequired: 'Please upload your final transcript from your previous institution to complete the academic review phase.',
  timeline: [
    { state: 'done', title: 'Application Submitted', meta: 'Oct 12, 2023 • 10:24 AM', body: 'Successfully received and assigned to admissions officer Sarah Jenkings.' },
    { state: 'done', title: 'Document Verification', meta: 'Oct 15, 2023 • 02:15 PM', body: 'Initial background and preliminary documentation check passed.' },
    { state: 'active', title: 'Academic Review', meta: 'In Progress', body: 'Reviewing scholastic records and extracurricular achievement portfolio.', progress: 75 },
    { state: 'pending', title: 'Interview Invitation', meta: 'Pending Review' },
    { state: 'pending', title: 'Final Decision', meta: 'Unscheduled' },
  ],
};
