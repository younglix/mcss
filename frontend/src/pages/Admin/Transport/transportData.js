export const stats = [
  { label: 'Active Routes', value: '12', note: '98% punctuality', icon: 'trending_up' },
  { label: 'Total Students', value: '482', progress: 85 },
  { label: 'Operational Fleet', value: '15/16', badge: '1 in Maintenance' },
];

export const routes = [
  { id: 'R-101', destination: 'North Ridge Estate', stops: '8 Stops', filled: 32, capacity: 45, status: 'On Time' },
  { id: 'R-102', destination: 'Green Valley Suburb', stops: '12 Stops', filled: 44, capacity: 45, status: 'Delayed' },
  { id: 'R-103', destination: 'West Side Academic Block', stops: '5 Stops', filled: 12, capacity: 30, status: 'On Time' },
  { id: 'R-104', destination: 'Central Plaza Express', stops: '3 Stops', filled: 28, capacity: 30, status: 'On Time' },
];
export const routeStatusTone = { 'On Time': 'success', Delayed: 'warning' };

export const selectedFleet = {
  vehicleId: 'MCSS-B12',
  model: 'Mercedes Benz Sprinter (2022)',
  driver: 'Robert Sterling',
  licenseNote: 'Valid until 2026',
  lastInspection: 'Oct 12, 2023',
};

export const studentMapping = [
  { name: 'Jane Doe', meta: 'Grade 10-B • Route R-101', initials: 'JD' },
  { name: 'Mark Knight', meta: 'Grade 8-A • Route R-101', initials: 'MK' },
  { name: 'Sarah Lee', meta: 'Grade 12-C • Route R-101', initials: 'SL' },
];
