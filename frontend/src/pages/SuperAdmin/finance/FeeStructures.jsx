import { useMemo } from 'react';
import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'category_name', label: 'Category' },
  { key: 'class_name', label: 'Class', render: (item) => item.class_name || 'All classes' },
  { key: 'session_name', label: 'Session' },
  { key: 'term_name', label: 'Term', render: (item) => item.term_name || 'Whole session' },
  { key: 'amount', label: 'Amount' },
];

function buildFields(extra) {
  const categoryOptions = (extra.categories || []).map((c) => ({ value: c.id, label: c.name }));
  const classOptions = (extra.classes || []).map((c) => ({ value: c.id, label: c.name }));
  const sessionOptions = (extra.sessions || []).map((s) => ({ value: s.id, label: s.name }));
  const termOptions = (extra.sessions || []).flatMap((s) => s.terms.map((t) => ({ value: t.id, label: `${t.name} — ${s.name}` })));
  return [
    { key: 'category', label: 'Fee Category', type: 'select', required: true, options: categoryOptions },
    { key: 'school_class', label: 'Class (leave blank for all classes)', type: 'select', options: classOptions },
    { key: 'session', label: 'Session', type: 'select', required: true, options: sessionOptions },
    { key: 'term', label: 'Term (leave blank for whole session)', type: 'select', options: termOptions },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
  ];
}

export default function SuperAdminFeeStructures() {
  const extraEndpoints = useMemo(() => ({
    categories: '/config/fee-categories', classes: '/config/classes', sessions: '/config/sessions',
  }), []);
  return (
    <AdminCrudPage
      pageTitle="Fee Structures"
      title="Fee Structures"
      subtitle="What each fee category costs, per class, per session/term. School Fees uses these to generate invoices."
      endpoint="/finance/fee-structures"
      itemLabel="Fee Structure"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ category: '', school_class: '', session: '', term: '', amount: '' }}
      emptyIcon="request_quote"
    />
  );
}
