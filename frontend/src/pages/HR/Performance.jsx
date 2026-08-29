import { useMemo } from 'react';
import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'staff_name', label: 'Staff' },
  { key: 'period', label: 'Period' },
  { key: 'rating', label: 'Rating', render: (item) => `${item.rating} / 5` },
  { key: 'reviewer_name', label: 'Reviewed By', render: (item) => item.reviewer_name || '—' },
  { key: 'comments', label: 'Comments', render: (item) => item.comments || '—' },
];

function buildFields(extra) {
  const staffOptions = (extra.staff || []).map((s) => ({ value: s.id, label: s.full_name }));
  return [
    { key: 'staff', label: 'Staff', type: 'select', required: true, options: staffOptions },
    { key: 'period', label: 'Period', type: 'text', required: true, placeholder: 'e.g. 2026 Term 1' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
    { key: 'comments', label: 'Comments', type: 'textarea' },
  ];
}

export default function HRPerformance() {
  const extraEndpoints = useMemo(() => ({ staff: '/users/?user_type=staff' }), []);
  return (
    <AdminCrudPage
      portalId="hr"
      pageTitle="Performance"
      title="Performance"
      subtitle="Staff performance reviews, one record per staff member per review period."
      endpoint="/operations/hr/performance"
      itemLabel="Performance Review"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ staff: '', period: '', rating: '', comments: '' }}
      emptyIcon="insights"
    />
  );
}
