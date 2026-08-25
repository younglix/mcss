import { useState } from 'react';
import Badge from '../../../components/ui/Badge.jsx';
import AdminCrudPage from './AdminCrudPage.jsx';
import { api } from '../../../lib/api.js';

const COLUMNS = [
  { key: 'full_name', label: 'Visitor' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'person_to_see', label: 'To See' },
  {
    key: 'status',
    label: 'Status',
    render: (item) => (
      <Badge tone={item.status === 'checked_in' ? 'secondary' : 'primary'}>
        {item.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
      </Badge>
    ),
  },
  {
    key: 'checked_in_at',
    label: 'Checked In',
    render: (item) => new Date(item.checked_in_at).toLocaleString(),
  },
];

const FORM_FIELDS = [
  { key: 'full_name', label: 'Visitor Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'purpose', label: 'Purpose of Visit', type: 'text', required: true },
  { key: 'person_to_see', label: 'Person to See', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

function CheckOutAction({ item, reload }) {
  const [loading, setLoading] = useState(false);
  if (item.status !== 'checked_in') return null;

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await api.post(`/reception/visitors/${item.id}/check-out`, {});
      reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleCheckOut} disabled={loading} className="p-2 text-outline hover:text-secondary transition-colors" title="Check out">
      <span className="material-symbols-outlined text-[20px]">logout</span>
    </button>
  );
}

export default function SuperAdminReception() {
  return (
    <AdminCrudPage
      pageTitle="Reception"
      title="Reception"
      subtitle="Front-desk visitor log."
      endpoint="/reception/visitors"
      itemLabel="Visitor"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ full_name: '', phone: '', purpose: '', person_to_see: '', notes: '' }}
      emptyIcon="support_agent"
      renderExtraActions={(item, reload) => <CheckOutAction item={item} reload={reload} />}
    />
  );
}
