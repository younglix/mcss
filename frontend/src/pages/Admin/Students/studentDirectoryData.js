export const filters = {
  classes: ['All Classes', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'],
  arms: ['All Arms', 'A (St. Peter)', 'B (St. Paul)', 'C (St. Jude)'],
  sessions: ['2023/2024', '2022/2023', '2021/2022'],
};

export const selectedCount = 12;
export const totalCount = 420;

export const students = [
  { name: 'Adeola Johnson', email: 'adeola.j@school.edu', id: 'MCSS/2023/042', classArm: 'SSS 2 - Saint Jude', status: 'Enrolled', initials: 'AJ' },
  {
    name: 'Chukwudi Okafor',
    email: 'c.okafor@school.edu',
    id: 'MCSS/2023/118',
    classArm: 'JSS 3 - Saint Paul',
    status: 'Enrolled',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZsRSaEBimFjeKQNCV1qsbTAKCVPzqgRxFdqoRf3vPjk-JnBplYjknCLE__piUZX1qQ70mXZ2QRl1yThvTF-GJFPuHhJL-nALteeFUHHAAHXsnnW8XmmjsykeHjReCMy_AYXiyyDC2OyEYoRKzHyh2EeLnXxe-oFCN8MNVdn3a3xVzf3rvwKjSCK-budCpKiVQMBDFxTMNwwO5ArpkjFfmhdp2dxka8llf3SearGyEgo21xlH3EdTxikIxUu_bQGw5P7EkAS7B-Kiy',
  },
  { name: 'Maryam Emeka', email: 'm.emeka@school.edu', id: 'MCSS/2018/005', classArm: 'Class of 2023', status: 'Graduated', initials: 'ME' },
  {
    name: 'Fatima Suleiman',
    email: 'f.suleiman@school.edu',
    id: 'MCSS/2023/209',
    classArm: 'JSS 1 - Saint Peter',
    status: 'Enrolled',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB0slrpeXMazdUQV5Qeu5YijuWTJLKtl-vlWHC_3Ctro7urW03D2d0K0zbhLzGbqfDnvPf9p8Y_MedTkv-WVB4x7oHqlP-oJwMqv4Vpp-0ChxEa95jYoul1nq1B2jHXJIUHXc_ar9VrtnXndaO5ZJQDq5NbLPyL2at2Nyds5cKZSG_WClK1Z_rs_TVFGUAvv4mNW1zsxJteRh8qb2trRhOrj5m6gz5FlPQXTttnI_gAXOLvBqw1YyJ7J7jI7AL0GXS7UYwafwL32Boc',
  },
];

export const pagination = { pages: [1, 2, 3], lastPage: 42, current: 1 };

export const capacity = {
  percentFull: 84,
  totalCapacity: 500,
  note: 'Enrollment is trending 5% higher than last year.',
};
