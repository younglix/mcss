export const stats = [
  { label: 'Total Capacity', value: 840, unit: 'Beds' },
  { label: 'Occupied', value: 792, unit: 'Beds', tone: 'secondary' },
  { label: 'Available', value: 48, unit: 'Beds', tone: 'tertiary' },
  { label: 'Occupancy Rate', value: 94.2, unit: '%', invert: true },
];

export const blocks = ["Block A (St. Jude's)", "Block B (St. Mary's)", "Block C (St. Benedict's)"];

export const allocations = [
  { block: "St. Jude's (A)", room: 'A-102', bed: 'Bed 01', occupant: 'James Dominic (Gr. 10)', initials: 'JD', status: 'Occupied' },
  { block: "St. Jude's (A)", room: 'A-102', bed: 'Bed 02', occupant: null, status: 'Vacant' },
  { block: "St. Jude's (A)", room: 'A-103', bed: 'Bed 01', occupant: 'Samuel Mbatha (Gr. 11)', initials: 'SM', status: 'Occupied' },
  { block: "St. Mary's (B)", room: 'B-205', bed: 'Bed 04', occupant: 'Liam Walters (Gr. 09)', initials: 'LW', status: 'Leave' },
  { block: "St. Mary's (B)", room: 'B-205', bed: 'Bed 05', occupant: 'Ethan Kim (Gr. 10)', initials: 'EK', status: 'Occupied' },
];

export const statusTone = { Occupied: 'success', Vacant: 'secondary', Leave: 'warning' };

export const waitlist = [
  { name: 'Marcus Thorne', meta: 'Grade 11-C • New Student', tags: ['Local', 'Medical: None'] },
  { name: 'Adrian Vance', meta: 'Grade 9-A • Waitlisted', tags: ['International'], alert: 'Allergy Alert' },
  { name: 'Nathaniel Cole', meta: 'Grade 12-D • Transfer', tags: [] },
  { name: 'Julian S.', meta: 'Grade 10-B • New student', tags: [] },
];
