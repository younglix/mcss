import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

// Every field here is exactly one column of the payout sheet — this record
// exists specifically to feed that export for staff with no portal account
// at all (cleaners, drivers, security, ...). HR owns it end-to-end.
const COLUMNS = [
  { key: 'full_name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'pay_amount', label: 'Pay Amount' },
  { key: 'account_number', label: 'Account No.' },
  { key: 'is_active', label: 'Active', render: (item) => (item.is_active ? 'Active' : 'Inactive') },
];

const FORM_FIELDS = [
  { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. John Doe' },
  { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Cleaner, Driver, Security Guard' },
  { key: 'pay_amount', label: 'Pay Amount', type: 'text', placeholder: 'e.g. 35000' },
  { key: 'payment_reference', label: 'Payment Reference', type: 'text' },
  { key: 'beneficiary_code', label: 'Beneficiary Code', type: 'text' },
  { key: 'account_number', label: 'Account No.', type: 'text' },
  { key: 'account_type', label: 'Account Type', type: 'text' },
  { key: 'sort_code', label: 'CBN Sort Code', type: 'text' },
  { key: 'is_cashcard', label: 'Is CashCard', type: 'checkbox' },
  { key: 'email', label: 'Email Address', type: 'text' },
  { key: 'currency_code', label: 'Currency Code', type: 'text', placeholder: 'NGN' },
  { key: 'is_active', label: 'Active', type: 'checkbox' },
];

export default function HRNonAcademicPayroll() {
  return (
    <AdminCrudPage
      portalId="hr"
      pageTitle="Non-Academic Staff Pay"
      title="Non-Academic Staff Pay"
      subtitle="Cleaners, drivers, security, and other payroll-only staff who never get a portal account — you own this pay record end-to-end. They feed straight into the payout sheet, no payroll structure involved."
      endpoint="/finance/non-academic-payouts"
      itemLabel="Record"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{
        full_name: '', title: '', pay_amount: '', payment_reference: '', beneficiary_code: '',
        account_number: '', account_type: '', sort_code: '', is_cashcard: false,
        email: '', currency_code: 'NGN', is_active: true,
      }}
      emptyIcon="engineering"
    />
  );
}
