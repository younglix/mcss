import { useMemo } from 'react';
import Badge from '../../../components/ui/Badge.jsx';
import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
];

const CONDITION_TONE = { new: 'success', good: 'secondary', fair: 'warning', poor: 'error', damaged: 'error' };

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'condition', label: 'Condition', render: (item) => <Badge tone={CONDITION_TONE[item.condition]}>{item.condition}</Badge> },
  { key: 'assigned_to_name', label: 'Assigned To', render: (item) => item.assigned_to_name || 'Unassigned' },
];

function buildFields(extra) {
  const staffOptions = (extra.staff || []).map((s) => ({ value: s.id, label: s.full_name }));
  return [
    { key: 'name', label: 'Asset Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'serial_number', label: 'Serial Number', type: 'text' },
    { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITION_OPTIONS },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'assigned_to', label: 'Assigned To', type: 'select', options: staffOptions },
  ];
}

export default function SuperAdminAssets() {
  const extraEndpoints = useMemo(() => ({ staff: '/users/?user_type=staff' }), []);
  return (
    <AdminCrudPage
      pageTitle="Assets"
      title="Assets"
      subtitle="Fixed assets — equipment, furniture, and their assignment."
      endpoint="/operations/assets"
      itemLabel="Asset"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ name: '', category: '', serial_number: '', purchase_date: '', value: '', condition: 'good', location: '', assigned_to: '' }}
      emptyIcon="warehouse"
    />
  );
}
