import { useMemo, useState } from 'react';
import Badge from '../../../components/ui/Badge.jsx';
import AdminCrudPage from '../administration/AdminCrudPage.jsx';
import { api } from '../../../lib/api.js';

const STATUS_TONE = { unpaid: 'error', partial: 'warning', paid: 'success', waived: 'secondary' };

const COLUMNS = [
  { key: 'student_name', label: 'Student' },
  { key: 'class_arm_label', label: 'Class', render: (item) => item.class_arm_label || '—' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'balance', label: 'Balance' },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <Badge tone={STATUS_TONE[item.status] || 'secondary'}>{item.status}</Badge>,
  },
];

function buildFields(extra) {
  const studentOptions = (extra.students || []).map((s) => ({ value: s.id, label: s.full_name }));
  const sessionOptions = (extra.sessions || []).map((s) => ({ value: s.id, label: s.name }));
  const termOptions = (extra.sessions || []).flatMap((s) => s.terms.map((t) => ({ value: t.id, label: `${t.name} — ${s.name}` })));
  return [
    { key: 'student', label: 'Student', type: 'select', required: true, options: studentOptions },
    { key: 'description', label: 'Description', type: 'text', required: true, placeholder: 'e.g. Tuition — First Term' },
    { key: 'session', label: 'Session', type: 'select', required: true, options: sessionOptions },
    { key: 'term', label: 'Term (optional)', type: 'select', options: termOptions },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'due_date', label: 'Due Date', type: 'date' },
  ];
}

function WaiveAction({ item, reload }) {
  const [loading, setLoading] = useState(false);
  if (item.status === 'waived' || item.status === 'paid') return null;

  const handleWaive = async () => {
    setLoading(true);
    try {
      await api.post(`/finance/invoices/${item.id}/waive`, {});
      reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleWaive} disabled={loading} title="Waive" className="p-2 text-outline hover:text-secondary transition-colors">
      <span className="material-symbols-outlined text-[20px]">remove_circle</span>
    </button>
  );
}

export default function SuperAdminInvoices() {
  const extraEndpoints = useMemo(() => ({ students: '/academics/students', sessions: '/config/sessions' }), []);
  return (
    <AdminCrudPage
      pageTitle="Invoices"
      title="Invoices"
      subtitle="Individual bills issued to students. Bulk-generate from Fee Structures on the School Fees page."
      endpoint="/finance/invoices"
      itemLabel="Invoice"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ student: '', description: '', session: '', term: '', amount: '', due_date: '' }}
      emptyIcon="receipt_long"
      renderExtraActions={(item, reload) => <WaiveAction item={item} reload={reload} />}
    />
  );
}
