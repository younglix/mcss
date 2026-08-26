import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/classes', subjects: '/academics/subjects', teachers: '/users/?user_type=staff' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };

export default function SuperAdminTimetable() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const arms = data?.classes || [];
  const subjects = data?.subjects || [];
  const teachers = data?.teachers || [];

  const [selectedArm, setSelectedArm] = useState('');
  // No class selected yet: query a syntactically-valid but unused UUID so the
  // request stays a clean "no results" instead of a malformed-filter error.
  const slotsEndpoint = `/academics/timetable?class_arm=${selectedArm || '00000000-0000-0000-0000-000000000000'}`;
  const slotsData = useDashboardData(useMemo(() => ({ slots: slotsEndpoint }), [slotsEndpoint]));
  const slots = slotsData.data?.slots || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formValues, setFormValues] = useState({ subject: '', teacher: '', day: 'monday', start_time: '', end_time: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      await api.post('/academics/timetable', { ...formValues, class_arm: selectedArm });
      setDrawerOpen(false);
      setFormValues({ subject: '', teacher: '', day: 'monday', start_time: '', end_time: '' });
      slotsData.reload();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/academics/timetable/${deleteTarget.id}`);
      setDeleteTarget(null);
      slotsData.reload();
    } finally {
      setDeleting(false);
    }
  };

  const fields = [
    { key: 'subject', label: 'Subject', type: 'select', required: true, options: subjects.map((s) => ({ value: s.id, label: s.name })) },
    { key: 'teacher', label: 'Teacher', type: 'select', options: teachers.map((t) => ({ value: t.id, label: t.full_name })) },
    { key: 'day', label: 'Day', type: 'select', required: true, options: DAYS.map((d) => ({ value: d, label: DAY_LABELS[d] })) },
    { key: 'start_time', label: 'Start Time', type: 'time', required: true },
    { key: 'end_time', label: 'End Time', type: 'time', required: true },
  ];

  return (
    <DashboardPageShell pageTitle="Timetable" title="Timetable" subtitle="Weekly class schedule, for the current session." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-sm mb-md">
            <select id="class-picker" value={selectedArm} onChange={(e) => setSelectedArm(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a class…</option>
              {arms.map((arm) => (
                <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>
              ))}
            </select>
            {selectedArm && (
              <Button variant="primary" iconLeft="add" onClick={() => setDrawerOpen(true)}>
                New Slot
              </Button>
            )}
          </div>

          {!selectedArm ? (
            <Card padding="lg">
              <EmptyState icon="schedule" text="Select a class to view its timetable." />
            </Card>
          ) : slots.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="schedule" text="No data available yet" />
            </Card>
          ) : (
            <div className="space-y-lg">
              {DAYS.filter((day) => slots.some((s) => s.day === day)).map((day) => (
                <div key={day}>
                  <h3 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wide mb-sm">{DAY_LABELS[day]}</h3>
                  <div className="space-y-xs">
                    {slots.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((slot) => (
                      <Card key={slot.id} padding="sm" className="flex items-center justify-between">
                        <div>
                          <span className="font-body-md text-body-md font-semibold text-on-surface">{slot.subject_name}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant ml-sm">
                            {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}{slot.teacher_name ? ` · ${slot.teacher_name}` : ''}
                          </span>
                        </div>
                        <button type="button" onClick={() => setDeleteTarget(slot)} className="p-1 text-outline hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Timetable Slot">
        <form onSubmit={handleSubmit} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {fields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={(v) => setFormValues((prev) => ({ ...prev, [field.key]: v }))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Slot?"
        message="This can't be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
