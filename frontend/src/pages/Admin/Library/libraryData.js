export const stats = [
  { icon: 'menu_book', iconTone: 'primary', label: 'Total Catalog', value: '12,482' },
  { icon: 'sync_alt', iconTone: 'secondary', label: 'Issued Books', value: '341' },
  { icon: 'warning', iconTone: 'tertiary', label: 'Overdue Items', value: '24' },
  { icon: 'groups', iconTone: 'primary', label: 'Active Readers', value: '892' },
];

export const catalog = [
  { title: 'A Tale of Two Cities', author: 'Charles Dickens', isbn: '978-0141439600', category: 'Classic Lit', status: 'Available' },
  { title: 'Quantum Mechanics', author: 'Richard Feynman', isbn: '978-0465025015', category: 'Physics', status: 'Checked Out' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', category: 'Classic Lit', status: 'Overdue' },
  { title: 'Advanced Calculus', author: 'G. B. Thomas', isbn: '978-0321587992', category: 'Mathematics', status: 'Available' },
];

export const statusTone = { Available: 'success', 'Checked Out': 'warning', Overdue: 'error' };

export const overdueItems = [
  { initials: 'JD', name: 'John Doe', book: '"The Great Gatsby" (#GAT-202)', daysLate: '8 Days Late', urgent: true },
  { initials: 'SA', name: 'Sarah Ahmed', book: '"Modern Chemistry" (#CHM-105)', daysLate: '3 Days Late', urgent: false },
];
export const totalOverdue = 24;

export const recentActivity = [
  { icon: 'keyboard_return', tone: 'success', title: 'Returned', detail: 'Biology 101', meta: 'Student: Alex Chen • 14 mins ago' },
  { icon: 'send', tone: 'secondary', title: 'Borrowed', detail: 'Hamlet (Shakespeare)', meta: 'Student: Maria Garcia • 42 mins ago' },
  { icon: 'add', tone: 'primary', title: 'New Entry', detail: 'Data Science Handbook', meta: 'Librarian: Mrs. Halloway • 2 hours ago' },
  { icon: 'keyboard_return', tone: 'success', title: 'Returned', detail: 'The Odyssey', meta: 'Student: Leo Smith • 3 hours ago' },
];
