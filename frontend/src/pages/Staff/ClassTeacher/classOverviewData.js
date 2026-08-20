export const classInfo = {
  academicYear: 'Academic Year 2024/25',
  className: 'Senior Secondary 2A',
  section: 'SS2A - Saint Jude',
  formMaster: 'Mr. Bernard Augustus',
  totalStudents: 32,
  male: 14,
  female: 18,
  photoUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjmTcoyijxwv2Jn4QbLYtPwzHQ-lpJs84d7ex_2uvMipEJ46L8s6tToPpcI_Fih9auToX9QoVB32wgTPPj46yQMLUXmYf9eGG3i581L46IunWxLlDQRZ3wZ8mmPQR1b0W7b0ZAX8y3dBpefZzKQ4Z6LtYMdUwZ-4IdJ-M2QV_Firo6_wxwJsrn0eBvHkaA1AdHtUzQ7UOpZqSGVuYj-gqo6kCVDGIUCW218kBh1W_Y3QLH8Fh48UBrBegRKTndmwk5HA3DohRnMfd',
};

export const reportCardStatus = {
  commentsCompleted: 24,
  subjectEntryVerified: 18,
  total: 32,
};

const present = 'present';
const absent = 'absent';
export const attendanceHeatmap = Array.from({ length: 32 }, (_, i) => ([2, 11, 20].includes(i) ? absent : present));
export const attendanceSummary = { present: 29, absent: 3, lateness: 2 };

export const students = [
  {
    name: 'Adebayor, Tolu',
    id: 'MCSS/24/0112',
    tags: ['Science', 'A-Avg'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAir7emBDhQQSKQzi_V7s-zz2fE-5V5ZMql7rvfrNjYMKLiACcVPD3jSRgxtbOZ8qmt74pC2mDW4iUDzqIw9gUV1GZtFgk51ZK9oC5Odgl4uQxp3pcU--npm5ZlTlP2DPVkWq2dj7JI75W57FfSuCnOu-2RjN4gM98p1fDb6KqltXLMyrsocFP-moZSZNh2ycATXPeYMHcLRjdC_H5Wt6DrGWGJWNbTAzy4amNyGk8ONSQnOyz77fEgRR0MYe6tng4623q2HA_2VhoW',
  },
  {
    name: 'Okeke, Chiamaka',
    id: 'MCSS/24/0045',
    tags: ['Alert', 'Art'],
    alert: true,
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqZ_ZH3sZs_OOPguA3fQwKOCi4IScL5UrgCGHVWrtBz8HDzfeL_Hs0rQTh6Fe2OKuvSFzZYfRgD02JavCptvJ5NyCQlFH6Ot9IvRiwZeHvggx4sH13thVQebWX-DdHjGFP6PNHwQyniyjijmY6PO4tl47a3U9OfQU4JE3X-vQFa8Cr2CGPrzeb36Pf9B8zGhSo3o1DX1uEik2EV78zFt4AwGapjkjr3xNlNuMNfcbc51pmkGPOGlt1UdAYN9RTjtt1uJ28wltJ483p',
  },
  {
    name: 'Williams, David',
    id: 'MCSS/24/0239',
    tags: ['Science', 'Prefect'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAGVm5AKR6LUPKHChgZSNuHpMwmS_F-uFiepDYom1qhHUuGoFod_wIRGq9b8ZEqbppSzj--aMM8lcZISX3j0Nwd2Fjx_yMquYEfJ6Aq-chhsc9vULxoEuDDzIJhKNJHTE9bobjcjCr7wfEHl3ftWbTXAoEh_imytOBVpkntc9u9srpgxBYxyRGYVRrsU-4dNrlboJqYg3vfVaLHQ2rgDaql03PpNJ66UAlkwj4vL1oK5Vi6iKrdOKdvk3Qisb-2yvKZ8mjof2IELA6D',
  },
  {
    name: 'Fatima, Zahra',
    id: 'MCSS/24/0155',
    tags: ['Commercial'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWd2TVBQ5tkIcVH0tG0BwNK-SETzHwXXQ5BMLKD_LXZI6Ko8_fZT6HtsUHs9PC4Sd8uCp4sTNeuD4TnL0fvcKvKvKaDHbNdRCMmWFbvU2wcFyZePThpCFTMt5yqRA0YMsW8UwbtWbgKrONK4araINjkG8C0RJYdH9sAzjrvInaguGDBF91GAsd4_QOsOsNoYzordP67OIMMr-OCItFpdEyRcV5LsNwKQaB7qKbmI4vjo6-7Ws8IFgTHw-dnAqh_Jd1gDGedCEVweRO',
  },
  {
    name: 'Ibrahim, Musa',
    id: 'MCSS/24/0301',
    tags: ['Art', 'A-Avg'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuARx82V2-lr-8DqOGpdJ-x55mN_pGE4R-N6-lZh4Anf4UN4R9rQq5MtVg3BpeE6Y1LLUrDmiYfx9cTZJF8_-vtHCea1fgoGq-JepnWrU3u-l3R4EASTuLdEBopBGZSmH4WzCcZqK2VLVjTdrd5L0yFBSfmzt-lJqgS6C4nFcKdO6B0KadO7ow9bhKUqksm7ExyYV-W_thYhuvglKtXW__EKuE3JlvLEL4L_qNV3eE7-7YeMuFab_D-EJlVUDi1JrD6LW33jxw7MHBVh',
  },
];
