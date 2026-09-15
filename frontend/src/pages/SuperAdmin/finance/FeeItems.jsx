import AdminCrudPage from '../administration/AdminCrudPage.jsx';
import Badge from '../../../components/ui/Badge.jsx';

const RESTRICTION_OPTIONS = [
  { value: 'none', label: 'No restriction — plain fee item' },
  { value: 'active_student', label: 'Active Student status (blocks broad academic activity)' },
  { value: 'library', label: 'Library (blocks new book loans)' },
  { value: 'hostel', label: 'Hostel (blocks hostel room allocation)' },
  { value: 'transport', label: 'Transport (blocks school bus/route assignment)' },
  { value: 'certificate', label: 'Certificate/Result (blocks report card & result downloads)' },
  { value: 'activity', label: 'Activity Participation (blocks joining school activities/events)' },
];
const RESTRICTION_TONE = {
  none: 'secondary', active_student: 'error', library: 'warning', hostel: 'warning',
  transport: 'warning', certificate: 'warning', activity: 'warning',
};

const COLUMNS = [
  { key: 'name', label: 'Fee Item' },
  { key: 'amount', label: 'Standard Amount', render: (item) => (item.amount != null ? `₦${Number(item.amount).toLocaleString()}` : '—') },
  { key: 'is_recurring', label: 'Recurring', render: (item) => (item.is_recurring ? 'Yes' : 'One-off') },
  {
    key: 'restriction_type', label: 'Restriction',
    render: (item) => (
      <Badge tone={RESTRICTION_TONE[item.restriction_type] || 'secondary'}>
        {item.restriction_type === 'none' ? 'None' : item.restriction_type_label}
      </Badge>
    ),
  },
];

const FORM_FIELDS = [
  { key: 'name', label: 'Fee Item Name', type: 'text', required: true, placeholder: 'e.g. Sportswear' },
  { key: 'amount', label: 'Standard Amount', type: 'number', required: true, placeholder: 'e.g. 1000' },
  { key: 'is_recurring', label: 'Recurring every session/term', type: 'checkbox' },
  {
    key: 'restriction_type', label: 'Restriction', type: 'select', options: RESTRICTION_OPTIONS,
    hint: 'What paying (or not paying) this fee item controls — leave as "No restriction" for a plain fee item like uniforms or books.',
  },
];

export default function SuperAdminFeeItems() {
  return (
    <AdminCrudPage
      pageTitle="Fee Items"
      title="Fee Items"
      subtitle="The catalog of named fee tickets — sportswear, medical fees, books, and the rest — with a standard price. Charge one to a student from Invoices. Some items can also restrict a student from an activity (library, hostel, transport, ...) until they're paid."
      endpoint="/config/fee-categories"
      itemLabel="Fee Item"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ name: '', amount: '', is_recurring: false, restriction_type: 'none' }}
      emptyIcon="sell"
    />
  );
}
