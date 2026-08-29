import { useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';
import { api, ApiError } from '../../lib/api.js';

const STATUS_TONE = { unpaid: 'error', partial: 'warning', paid: 'success', waived: 'secondary' };

const COLUMNS = [
  { key: 'student_name', label: 'Student' },
  { key: 'class_arm_label', label: 'Class', render: (item) => item.class_arm_label || '—' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'total_discount', label: 'Discount', render: (item) => (Number(item.total_discount) > 0 ? item.total_discount : '—') },
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
  const feeItemOptions = (extra.feeItems || []).map((c) => ({
    value: c.id, label: c.amount != null ? `${c.name} — ₦${Number(c.amount).toLocaleString()}` : c.name,
  }));
  return [
    { key: 'student', label: 'Student', type: 'select', required: true, options: studentOptions },
    { key: 'fee_item', label: 'Fee Item (optional — fills in description & amount)', type: 'select', options: feeItemOptions },
    { key: 'description', label: 'Description', type: 'text', required: true, placeholder: 'e.g. Tuition — First Term' },
    { key: 'session', label: 'Session', type: 'select', required: true, options: sessionOptions },
    { key: 'term', label: 'Term (optional)', type: 'select', options: termOptions },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'due_date', label: 'Due Date', type: 'date' },
  ];
}

function handleFieldChange(key, value, _formValues, setFormValues, extra) {
  if (key !== 'fee_item') return;
  const item = (extra.feeItems || []).find((c) => c.id === value);
  if (!item) return;
  setFormValues((prev) => ({
    ...prev,
    description: item.name,
    amount: item.amount != null ? String(item.amount) : prev.amount,
  }));
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

function BulkGenerate({ extra, reload }) {
  const [armId, setArmId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const arms = extra.classArms || [];
  const currentSession = (extra.sessions || []).find((s) => s.is_current);

  const handleGenerate = async () => {
    if (!armId || !currentSession) return;
    setGenerating(true);
    setMessage('');
    setError('');
    try {
      const armInfo = arms.find((a) => a.id === armId);
      const result = await api.post('/finance/school-fees/generate', {
        school_class: armInfo.school_class, session: currentSession.id,
      });
      setMessage(`Generated ${result.count} invoice(s).`);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate invoices.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card padding="lg" className="mb-md">
      <h3 className="font-label-md text-primary uppercase mb-sm">Bulk-Generate from Fee Structure</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">Raise an invoice for every active student in a class, off whatever Fee Structures apply to it.</p>
      <div className="flex items-center gap-sm flex-wrap">
        <select value={armId} onChange={(e) => setArmId(e.target.value)} className="mcss-field px-md w-auto">
          <option value="">Select a class…</option>
          {arms.map((arm) => <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>)}
        </select>
        <Button variant="secondary" onClick={handleGenerate} disabled={!armId || generating || !currentSession}>
          {generating ? 'Generating…' : 'Generate Invoices'}
        </Button>
      </div>
      {error && <p className="font-label-sm text-label-sm text-error mt-sm">{error}</p>}
      {message && <p className="font-label-sm text-label-sm text-secondary mt-sm">{message}</p>}
    </Card>
  );
}

export default function BursaryStudentInvoices() {
  const extraEndpoints = useMemo(() => ({
    students: '/academics/students', sessions: '/config/sessions', feeItems: '/config/fee-categories', classArms: '/academics/classes',
  }), []);
  return (
    <AdminCrudPage
      portalId="bursary"
      pageTitle="Student Invoices"
      title="Student Invoices"
      subtitle="Individual fee tickets issued to students — pick a Fee Item to auto-fill one, or bulk-generate termly fees below."
      endpoint="/finance/invoices"
      itemLabel="Invoice"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      onFieldChange={handleFieldChange}
      initialFormValues={{ student: '', fee_item: '', description: '', session: '', term: '', amount: '', due_date: '' }}
      emptyIcon="receipt_long"
      renderExtraActions={(item, reload) => <WaiveAction item={item} reload={reload} />}
      renderBeforeList={(extra, reload) => <BulkGenerate extra={extra} reload={reload} />}
    />
  );
}
