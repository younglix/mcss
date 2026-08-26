import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { postings: '/operations/recruitment/postings' };

const APPLICATION_STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const STATUS_TONE = { submitted: 'secondary', shortlisted: 'warning', rejected: 'error', hired: 'success' };

function ApplicationsPanel({ posting }) {
  const [applications, setApplications] = useState(null);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [values, setValues] = useState({ applicant_name: '', email: '', phone: '', resume_url: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const list = await api.get(`/operations/recruitment/postings/${posting.id}/applications`);
    setApplications(list);
  };

  const toggleOpen = () => {
    if (!open && applications === null) load();
    setOpen(!open);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/operations/recruitment/postings/${posting.id}/applications`, values);
      setAddOpen(false);
      setValues({ applicant_name: '', email: '', phone: '', resume_url: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (appId, status) => {
    await api.patch(`/operations/recruitment/applications/${appId}`, { status });
    load();
  };

  return (
    <div>
      <button type="button" onClick={toggleOpen} className="font-label-sm text-label-sm text-primary hover:underline">
        {open ? 'Hide' : 'View'} Applications ({posting.application_count})
      </button>
      {open && (
        <div className="mt-sm space-y-sm">
          {(applications || []).length === 0 ? (
            <p className="font-label-sm text-label-sm text-outline">No applications yet.</p>
          ) : (
            applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-sm p-sm rounded-lg border border-outline/10">
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">{a.applicant_name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{a.email || a.phone || '—'}</p>
                </div>
                <select value={a.status} onChange={(e) => handleStatusChange(a.id, e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
                  {APPLICATION_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))
          )}
          <button type="button" onClick={() => setAddOpen(true)} className="font-label-sm text-label-sm text-primary hover:underline">+ Add Application</button>
        </div>
      )}

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={`Application — ${posting.title}`}>
        <form onSubmit={handleAdd} className="space-y-lg">
          <FormField field={{ key: 'applicant_name', id: `app_name_${posting.id}`, label: 'Applicant Name', type: 'text', required: true }} value={values.applicant_name} onChange={(v) => setValues((p) => ({ ...p, applicant_name: v }))} />
          <FormField field={{ key: 'email', id: `app_email_${posting.id}`, label: 'Email', type: 'text' }} value={values.email} onChange={(v) => setValues((p) => ({ ...p, email: v }))} />
          <FormField field={{ key: 'phone', id: `app_phone_${posting.id}`, label: 'Phone', type: 'text' }} value={values.phone} onChange={(v) => setValues((p) => ({ ...p, phone: v }))} />
          <FormField field={{ key: 'resume_url', id: `app_resume_${posting.id}`, label: 'Resume URL', type: 'text' }} value={values.resume_url} onChange={(v) => setValues((p) => ({ ...p, resume_url: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving || !values.applicant_name}>{saving ? 'Saving…' : 'Add'}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function SuperAdminRecruitment() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const postings = data?.postings || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ title: '', description: '', status: 'open', closing_date: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setValues({ title: '', description: '', status: 'open', closing_date: '' });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (posting) => {
    setEditing(posting);
    setValues({ title: posting.title, description: posting.description, status: posting.status, closing_date: posting.closing_date || '' });
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const payload = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
      if (editing) {
        await api.patch(`/operations/recruitment/postings/${editing.id}`, payload);
      } else {
        await api.post('/operations/recruitment/postings', payload);
      }
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/operations/recruitment/postings/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Recruitment" title="Recruitment" subtitle="Job postings and applications." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openCreate}>New Posting</Button>
          </div>
          {postings.length === 0 ? (
            <Card padding="lg"><EmptyState icon="person_search" text="No data available yet" /></Card>
          ) : (
            <div className="space-y-md">
              {postings.map((posting) => (
                <Card key={posting.id} padding="lg" className="space-y-sm">
                  <div className="flex items-start justify-between gap-sm">
                    <div>
                      <h3 className="font-headline-md text-headline-sm text-on-surface">{posting.title}</h3>
                      <Badge tone={posting.status === 'open' ? 'success' : 'secondary'}>{posting.status}</Badge>
                    </div>
                    <div className="flex items-center gap-xs">
                      <button type="button" onClick={() => openEdit(posting)} className="p-1 text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(posting)} className="p-1 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {posting.description && <p className="font-body-md text-body-md text-on-surface-variant">{posting.description}</p>}
                  <ApplicationsPanel posting={posting} />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Posting' : 'New Posting'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField field={{ key: 'title', label: 'Title', type: 'text', required: true }} value={values.title} onChange={(v) => setValues((p) => ({ ...p, title: v }))} error={errors.title?.[0]} />
          <FormField field={{ key: 'description', label: 'Description', type: 'textarea' }} value={values.description} onChange={(v) => setValues((p) => ({ ...p, description: v }))} />
          <FormField field={{ key: 'status', label: 'Status', type: 'select', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }] }} value={values.status} onChange={(v) => setValues((p) => ({ ...p, status: v }))} />
          <FormField field={{ key: 'closing_date', label: 'Closing Date', type: 'date' }} value={values.closing_date} onChange={(v) => setValues((p) => ({ ...p, closing_date: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Posting'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Posting?"
        message={`This can't be undone. Delete "${deleteTarget?.title}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
