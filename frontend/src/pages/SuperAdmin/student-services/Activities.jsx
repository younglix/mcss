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

const ENDPOINTS = { activities: '/student-services/activities', students: '/academics/students', staff: '/users/?user_type=staff' };

const CATEGORY_OPTIONS = [
  { value: 'club', label: 'Club' },
  { value: 'sport', label: 'Sport' },
  { value: 'society', label: 'Society' },
  { value: 'other', label: 'Other' },
];

function ParticipantsPanel({ activity, students, reload }) {
  const [participants, setParticipants] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const list = await api.get(`/student-services/activities/${activity.id}/participants`);
      setParticipants(list);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!open && participants === null) loadParticipants();
    setOpen(!open);
  };

  const handleEnroll = async () => {
    if (!studentId) return;
    setSaving(true);
    try {
      await api.post(`/student-services/activities/${activity.id}/participants`, { student: studentId });
      setStudentId('');
      loadParticipants();
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (participantId) => {
    await api.delete(`/student-services/activities/participants/${participantId}`);
    loadParticipants();
    reload();
  };

  const enrolledIds = new Set((participants || []).map((p) => p.student));

  return (
    <div>
      <button type="button" onClick={toggleOpen} className="font-label-sm text-label-sm text-primary hover:underline">
        {open ? 'Hide' : 'Manage'} Participants ({activity.participant_count})
      </button>
      {open && (
        <div className="mt-sm">
          {loading ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">Loading…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-xs mb-sm">
                {(participants || []).length === 0 ? (
                  <span className="font-label-sm text-label-sm text-outline">No participants yet.</span>
                ) : (
                  participants.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                      {p.student_name}
                      <button type="button" onClick={() => handleRemove(p.id)} className="hover:text-error">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex items-center gap-sm flex-wrap">
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
                  <option value="">Add student…</option>
                  {students.filter((s) => !enrolledIds.has(s.id)).map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <Button variant="ghost" iconLeft="add" onClick={handleEnroll} disabled={saving || !studentId}>Add</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminActivities() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const activities = data?.activities || [];
  const students = data?.students || [];
  const staff = data?.staff || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ name: '', category: 'other', description: '', supervisor: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setValues({ name: '', category: 'other', description: '', supervisor: '' });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (activity) => {
    setEditing(activity);
    setValues({ name: activity.name, category: activity.category, description: activity.description, supervisor: activity.supervisor || '' });
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
        await api.patch(`/student-services/activities/${editing.id}`, payload);
      } else {
        await api.post('/student-services/activities', payload);
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
      await api.delete(`/student-services/activities/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Activities" title="Activities" subtitle="Clubs, sports, and societies." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openCreate}>New Activity</Button>
          </div>
          {activities.length === 0 ? (
            <Card padding="lg"><EmptyState icon="sports_soccer" text="No data available yet" /></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {activities.map((activity) => (
                <Card key={activity.id} padding="lg" className="space-y-sm">
                  <div className="flex items-start justify-between gap-sm">
                    <div>
                      <h3 className="font-headline-md text-headline-sm text-on-surface">{activity.name}</h3>
                      <Badge tone="secondary">{activity.category}</Badge>
                    </div>
                    <div className="flex items-center gap-xs">
                      <button type="button" onClick={() => openEdit(activity)} className="p-1 text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(activity)} className="p-1 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {activity.description && <p className="font-body-md text-body-md text-on-surface-variant">{activity.description}</p>}
                  {activity.supervisor_name && <p className="font-label-sm text-label-sm text-on-surface-variant">Supervisor: {activity.supervisor_name}</p>}
                  <ParticipantsPanel activity={activity} students={students} reload={reload} />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Activity' : 'New Activity'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField field={{ key: 'name', label: 'Name', type: 'text', required: true }} value={values.name} onChange={(v) => setValues((p) => ({ ...p, name: v }))} error={errors.name?.[0]} />
          <FormField field={{ key: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS }} value={values.category} onChange={(v) => setValues((p) => ({ ...p, category: v }))} />
          <FormField field={{ key: 'description', label: 'Description', type: 'textarea' }} value={values.description} onChange={(v) => setValues((p) => ({ ...p, description: v }))} />
          <FormField field={{ key: 'supervisor', label: 'Supervisor', type: 'select', options: staff.map((s) => ({ value: s.id, label: s.full_name })) }} value={values.supervisor} onChange={(v) => setValues((p) => ({ ...p, supervisor: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Activity'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Activity?"
        message={`This can't be undone. Delete "${deleteTarget?.name}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
