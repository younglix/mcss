import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'paid_to', label: 'Paid To', render: (item) => item.paid_to || '—' },
];

const FORM_FIELDS = [
  { key: 'category', label: 'Category', type: 'text', required: true, placeholder: 'e.g. Utilities, Maintenance' },
  { key: 'description', label: 'Description', type: 'text', required: true },
  { key: 'amount', label: 'Amount', type: 'number', required: true },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'paid_to', label: 'Paid To', type: 'text' },
];

export default function BursaryExpenses() {
  return (
    <AdminCrudPage
      portalId="bursary"
      pageTitle="Expenses"
      title="Expenses"
      subtitle="Non-payroll school expenditure."
      endpoint="/finance/expenses"
      itemLabel="Expense"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ category: '', description: '', amount: '', date: '', paid_to: '' }}
      emptyIcon="trending_down"
    />
  );
}
