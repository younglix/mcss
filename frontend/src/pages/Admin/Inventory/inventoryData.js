export const totals = { assets: '1,428', deltaText: '+12%', deltaNote: 'Since last quarter', lowStock: 24 };

export const categories = ['All Items', 'Science Lab', 'Stationery', 'Electronics', 'Sports'];

export const items = [
  { id: '#INV-8821', name: 'Microscope Slides (Pack of 50)', category: 'Science Lab', qty: 12, location: 'Lab Storage B-4', status: 'Low Stock' },
  { id: '#INV-9023', name: 'Whiteboard Markers (Blue)', category: 'Stationery', qty: 420, location: 'Main Admin Store', status: 'In Stock' },
  { id: '#INV-8845', name: 'Graphing Calculators TI-84', category: 'Electronics', qty: 5, location: 'Math Dept Office', status: 'Critical' },
  { id: '#INV-1029', name: 'A4 Printing Paper (Reams)', category: 'Stationery', qty: 85, location: 'Main Admin Store', status: 'In Stock' },
  { id: '#INV-4412', name: 'Basketballs (Wilson)', category: 'Sports', qty: 24, location: 'Gymnasium Lockers', status: 'In Stock' },
];

export const statusTone = { 'In Stock': 'success', 'Low Stock': 'warning', Critical: 'error' };

export const recentActivity = [
  { icon: 'add_box', tone: 'primary', text: 'Added 500 units of A4 Paper', meta: 'Today, 10:45 AM • Admin Smith' },
  { icon: 'remove_done', tone: 'tertiary', text: 'Withdrawn 15 Microscope Slides', meta: 'Yesterday, 03:20 PM • Biology Dept' },
  { icon: 'inventory', tone: 'secondary', text: 'Stock Audit Completed: Sports', meta: 'Oct 24, 09:00 AM • System Task' },
];

export const pendingRequests = 8;
