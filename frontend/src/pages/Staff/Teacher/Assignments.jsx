import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { assignments: '/academics/teaching/assignments', classes: '/academics/teaching/classes' };
const EMPTY_FORM = { class_arm: '', subject: '', title: '', description: '', due_date: '' };

export default function TeacherAssignments() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const assignments = [...(data?.assignments || [])].sort((a, b) => b.due_date.localeCompare(a.due_date));
  const classes = data?.classes || [];
  const today = new Date().toISOString().slice(0, 10);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const subjectsForArm = (armId) => classes.find((c) => c.id === armId)?.subjects || [];

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    try {
      await api.post('/academics/teaching/assignments', form);
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create the assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/academics/teaching/assignments/${id}`);
    reload();
  };

  return (
    <AppShell portalId="teacher" pageTitle="Assignments" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Assignments"
          subtitle="Create, distribute, and review assignments for your classes."
          actions={<Button variant="primary" iconLeft="add" onClick={openNew}>New Assignment</Button>}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : assignments.length === 0 ? (
          <Card padding="lg"><EmptyState icon="assignment" text="You haven't given any assignment yet." /></Card>
        ) : (
          <div className="space-y-md">
            {assignments.map((a) => {
              const overdue = a.due_date < today;
              return (
                <Card key={a.id} padding="lg">
                  <div className="flex items-start justify-between gap-md flex-wrap">
                    <div>
                      <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{a.subject_name} · {a.class_arm_label}</p>
                      <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{a.title}</h3>
                      {a.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-sm">
                      <Badge tone={overdue ? 'error' : 'secondary'}>Due {a.due_date}</Badge>
                      <button type="button" onClick={() => handleDelete(a.id)} className="p-1 text-outline hover:text-error transition-colors" aria-label="Delete assignment">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="New Assignment"
        footer={(
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.class_arm || !form.subject || !form.title || !form.due_date}>
            {saving ? 'Creating…' : 'Create Assignment'}
          </Button>
        )}
      >
        <div className="space-y-md">
          {formError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{formError}</p>}
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Class</label>
            <select
              value={form.class_arm}
              onChange={(e) => setForm((prev) => ({ ...prev, class_arm: e.target.value, subject: '' }))}
              className="mcss-field w-full px-md"
            >
              <option value="">Select a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              disabled={!form.class_arm}
              className="mcss-field w-full px-md disabled:opacity-50"
            >
              <option value="">Select a subject…</option>
              {subjectsForArm(form.class_arm).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mcss-field w-full px-md"
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mcss-field w-full px-md py-sm resize-none"
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
              className="mcss-field w-full px-md"
            />
          </div>
        </div>
      </Drawer>
    </AppShell>
  );
}
