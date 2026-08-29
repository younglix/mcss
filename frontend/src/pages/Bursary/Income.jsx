import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'received_from', label: 'Received From', render: (item) => item.received_from || '—' },
];

const FORM_FIELDS = [
  { key: 'category', label: 'Category', type: 'text', required: true, placeholder: 'e.g. Donation, Facility Rental, Grant' },
  { key: 'description', label: 'Description', type: 'text', required: true },
  { key: 'amount', label: 'Amount', type: 'number', required: true },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'received_from', label: 'Received From', type: 'text' },
];

export default function BursaryIncome() {
  return (
    <AdminCrudPage
      portalId="bursary"
      pageTitle="Income"
      title="Income"
      subtitle="Non-fee revenue — donations, rentals, grants, and other income."
      endpoint="/finance/income"
      itemLabel="Income"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ category: '', description: '', amount: '', date: '', received_from: '' }}
      emptyIcon="trending_up"
    />
  );
}
