import { useMemo } from 'react';
import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'student_name', label: 'Student' },
  { key: 'invoice_description', label: 'Invoice' },
  { key: 'amount', label: 'Amount' },
  { key: 'reason', label: 'Reason', render: (item) => item.reason || '—' },
  { key: 'applied_by_name', label: 'Applied By', render: (item) => item.applied_by_name || '—' },
];

function buildFields(extra) {
  const invoiceOptions = (extra.invoices || [])
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'waived')
    .map((inv) => ({ value: inv.id, label: `${inv.student_name} — ${inv.description} (balance ${inv.balance})` }));
  return [
    { key: 'invoice', label: 'Invoice', type: 'select', required: true, options: invoiceOptions },
    { key: 'amount', label: 'Discount Amount', type: 'number', required: true },
    { key: 'reason', label: 'Reason', type: 'text', placeholder: 'e.g. Sibling discount, hardship case' },
  ];
}

export default function BursaryDiscounts() {
  const extraEndpoints = useMemo(() => ({ invoices: '/finance/invoices' }), []);
  return (
    <AdminCrudPage
      portalId="bursary"
      pageTitle="Discounts"
      title="Discounts"
      subtitle="One-off reductions applied to a student's invoice. For a recurring award, use Scholarships instead."
      endpoint="/finance/discounts"
      itemLabel="Discount"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ invoice: '', amount: '', reason: '' }}
      emptyIcon="sell"
    />
  );
}
