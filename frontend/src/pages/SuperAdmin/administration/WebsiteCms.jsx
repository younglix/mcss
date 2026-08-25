import Badge from '../../../components/ui/Badge.jsx';
import AdminCrudPage from './AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  {
    key: 'is_active',
    label: 'Status',
    render: (item) => <Badge tone={item.is_active ? 'success' : 'secondary'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>,
  },
  { key: 'starts_at', label: 'Starts', render: (item) => (item.starts_at ? new Date(item.starts_at).toLocaleString() : '—') },
  { key: 'ends_at', label: 'Ends', render: (item) => (item.ends_at ? new Date(item.ends_at).toLocaleString() : '—') },
];

const FORM_FIELDS = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'body', label: 'Message', type: 'textarea', required: true, rows: 4 },
  { key: 'is_active', label: 'Active (visible on the public site)', type: 'checkbox' },
  { key: 'starts_at', label: 'Starts At (optional)', type: 'datetime-local' },
  { key: 'ends_at', label: 'Ends At (optional)', type: 'datetime-local' },
];

export default function SuperAdminWebsiteCms() {
  return (
    <AdminCrudPage
      pageTitle="Website / CMS"
      title="Website / CMS"
      subtitle="Site announcements shown on the public-facing website."
      endpoint="/cms/announcements"
      itemLabel="Announcement"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ title: '', body: '', is_active: true, starts_at: '', ends_at: '' }}
      emptyIcon="language"
    />
  );
}
