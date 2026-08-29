import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'start_at', label: 'Starts', render: (item) => new Date(item.start_at).toLocaleString() },
  { key: 'location', label: 'Location' },
  { key: 'audience', label: 'Audience', render: (item) => item.audience.charAt(0).toUpperCase() + item.audience.slice(1) },
];

const FORM_FIELDS = [
  { key: 'title', label: 'Event Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'start_at', label: 'Starts At', type: 'datetime-local', required: true },
  { key: 'end_at', label: 'Ends At', type: 'datetime-local' },
  { key: 'location', label: 'Location', type: 'text' },
  {
    key: 'audience',
    label: 'Audience',
    type: 'select',
    required: true,
    options: [
      { value: 'all', label: 'Everyone' },
      { value: 'staff', label: 'Staff' },
      { value: 'students', label: 'Students' },
      { value: 'parents', label: 'Parents' },
    ],
  },
];

export default function PrincipalCalendar() {
  return (
    <AdminCrudPage
      portalId="principal"
      pageTitle="Calendar"
      title="Calendar"
      subtitle="School events, holidays, and important dates."
      endpoint="/calendar/events"
      itemLabel="Event"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ title: '', description: '', start_at: '', end_at: '', location: '', audience: 'all' }}
      emptyIcon="event"
    />
  );
}
