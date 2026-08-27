import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'name', label: 'Fee Item' },
  { key: 'amount', label: 'Standard Amount', render: (item) => (item.amount != null ? `₦${Number(item.amount).toLocaleString()}` : '—') },
  { key: 'is_recurring', label: 'Recurring', render: (item) => (item.is_recurring ? 'Yes' : 'One-off') },
];

const FORM_FIELDS = [
  { key: 'name', label: 'Fee Item Name', type: 'text', required: true, placeholder: 'e.g. Sportswear' },
  { key: 'amount', label: 'Standard Amount', type: 'number', required: true, placeholder: 'e.g. 1000' },
  { key: 'is_recurring', label: 'Recurring every session/term', type: 'checkbox' },
];

export default function SuperAdminFeeItems() {
  return (
    <AdminCrudPage
      pageTitle="Fee Items"
      title="Fee Items"
      subtitle="The catalog of named fee tickets — sportswear, medical fees, books, and the rest — with a standard price. Charge one to a student from Invoices."
      endpoint="/config/fee-categories"
      itemLabel="Fee Item"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ name: '', amount: '', is_recurring: false }}
      emptyIcon="sell"
    />
  );
}
