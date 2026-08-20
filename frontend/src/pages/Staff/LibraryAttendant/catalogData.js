export const circulation = { total: 2481, borrowed: 156, overdue: 24 };
export const shift = { attendant: 'Sister Mary Grace', endsIn: '2h 15m' };

export const genres = ['All Genres', 'Theology', 'Sciences', 'Literature', 'History'];

export const catalog = [
  {
    title: 'Confessions of St. Augustine',
    shelf: 'Shelf 4A-22',
    author: 'St. Augustine',
    isbn: '978-0140441147',
    genre: 'Theology',
    status: 'Available',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_t5PcALD_CizRC8PseX5ZHmMk4gCrIO_Dt7S0p1GAjyLyldf9O-WdNdIEDXfyzkBKwFo9oUcOKvGSyuQGMfu4pNVtVvFHv0wXbhnxR3gO4nMOTCIsdXWv_fCmyinoTq_nO1YvXnnDnxuef1KQPfkzi3wJUZ1NM_vY1dzEFuGB6rQ-BKiTGTNx4NtSm-9eWM7LYgDvIYGOQ3S46HUMaOFtEd-5KBtYfeiv7sxTuC4vNZmHLMWtr6Yc19vwaxw3ZbzCQl_cZDhESBJ3',
  },
  {
    title: 'Principles of Biology v2',
    shelf: 'Shelf 12C-04',
    author: 'Dr. Robert Chen',
    isbn: '978-0131404467',
    genre: 'Sciences',
    status: 'Borrowed',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAEVF-ltP_oQTMYUppslI0X9oqGnXgE2Eq4L9krrdfj0-EI9SsEMSg1y3D0ov8q3jKc4Rx8-V3Ee2D4otWAnA3EOi740L-50pSrClxIu8jW5KBNTbttuiwpBvVG4F7hzchVfnY602-UmtYjKf908_CtzJIPW-hjbgGUAVLY7w0iSTyV-_pq8zaeq_Cev6SgaEVNhSZuvfE92sgV3WazuMMNU2z699srLhJdSi7EF-LbR1YfoagFB5Pfb1S0b6nMX9_-Hw_FGS4m7-45',
  },
  {
    title: 'Great Expectations',
    shelf: 'Shelf 7B-11',
    author: 'Charles Dickens',
    isbn: '978-0141439563',
    genre: 'Literature',
    status: 'Available',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAVjzLFudwDomx_oZAaY-zr9ND-5ROx-ld18YLxVFNwL7XoaeWXjZNGZAjQZ2tvoDv5t93EAw11L1L-U9Qw0HMWhaD3Z8rdZQ3zDxs6cZ3A37g270cMmnBqr-b91IeXeg--OQAQI2D-tXxB8pnZwjr0cBboUIL3-w3fkaCusolvtMyNwAMX2yYDYhl4E4j43Cjs8M6z09aj9-lfl-YNeQM0hk44PNUtgKTgn2Hdmeqq3jB932WvuWUd98DEYdZjSJcROyyiMz9O-g5A',
  },
];

export const shortcuts = [
  { icon: 'qr_code_scanner', title: 'Bulk Check-out', description: 'Rapid scanner mode for classes.', tone: 'primary' },
  { icon: 'assignment_late', title: 'Report Damage', description: 'Flag items for preservation.', tone: 'tertiary' },
  { icon: 'local_library', title: 'Inter-Library Loan', description: 'Request from partner schools.', tone: 'secondary' },
];
