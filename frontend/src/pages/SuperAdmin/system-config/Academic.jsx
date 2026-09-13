import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import SectionShell from './SectionShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=academic', grades: '/config/grade-scales' };

const RULE_FIELDS = [
  { key: 'academic.gpa_enabled', id: 'gpa_enabled', label: 'Enable GPA calculation', type: 'checkbox' },
  { key: 'academic.gpa_scale', id: 'gpa_scale', label: 'GPA Scale', type: 'text', placeholder: 'e.g. 5.0' },
  {
    key: 'academic.score_calculation', id: 'score_calculation', label: 'Score Calculation', type: 'select',
    options: [{ value: 'simple_average', label: 'Simple Average' }, { value: 'weighted_average', label: 'Weighted Average' }],
  },
  { key: 'result.pass_mark', id: 'pass_mark', label: 'Pass Mark (%)', type: 'number' },
  { key: 'academic.attendance_min_percent', id: 'attendance_min_percent', label: 'Minimum Attendance for Promotion (%)', type: 'number' },
  { key: 'academic.promotion_min_average', id: 'promotion_min_average', label: 'Minimum Average to Promote (%)', type: 'number' },
  { key: 'academic.graduation_min_average', id: 'graduation_min_average', label: 'Minimum Average to Graduate (%)', type: 'number' },
  { key: 'academic.exam_retakes_allowed', id: 'exam_retakes_allowed', label: 'Allow exam retakes', type: 'checkbox' },
  { key: 'result.show_position', id: 'show_position', label: 'Show class position on report cards', type: 'checkbox' },
  { key: 'result.lock_after_publish', id: 'lock_after_publish', label: 'Lock results after publishing', type: 'checkbox' },
];

function GradeScalesCard({ grades, reload }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ name: '', min_score: '', max_score: '', remark: '', grade_point: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setValues({ name: '', min_score: '', max_score: '', remark: '', grade_point: '' });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (grade) => {
    setEditing(grade);
    setValues({ name: grade.name, min_score: grade.min_score, max_score: grade.max_score, remark: grade.remark, grade_point: grade.grade_point ?? '' });
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
        await api.patch(`/config/grade-scales/${editing.id}`, payload);
      } else {
        await api.post('/config/grade-scales', payload);
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
      await api.delete(`/config/grade-scales/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-3xl">
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-headline-md text-headline-md text-primary">Grading System</h2>
        <Button type="button" variant="ghost" iconLeft="add" onClick={openCreate}>New Grade</Button>
      </div>
      {grades.length === 0 ? (
        <EmptyState icon="grading" text="No data available yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-primary text-on-primary">
              <th className="px-md py-2 font-label-sm text-label-sm uppercase">Grade</th>
              <th className="px-md py-2 font-label-sm text-label-sm uppercase">Range</th>
              <th className="px-md py-2 font-label-sm text-label-sm uppercase">Remark</th>
              <th className="px-md py-2 font-label-sm text-label-sm uppercase">GP</th>
              <th className="px-md py-2 font-label-sm text-label-sm uppercase text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-outline/10">
              {grades.map((g) => (
                <tr key={g.id}>
                  <td className="px-md py-2 font-label-md text-label-md font-bold">{g.name}</td>
                  <td className="px-md py-2 font-label-sm text-label-sm">{g.min_score}–{g.max_score}</td>
                  <td className="px-md py-2 font-label-sm text-label-sm">{g.remark}</td>
                  <td className="px-md py-2 font-label-sm text-label-sm">{g.grade_point ?? '—'}</td>
                  <td className="px-md py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(g)} className="p-1 text-outline hover:text-primary"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button type="button" onClick={() => setDeleteTarget(g)} className="p-1 text-outline hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Grade' : 'New Grade'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField field={{ key: 'name', id: 'grade_name', label: 'Grade (e.g. A1)', type: 'text', required: true }} value={values.name} onChange={(v) => setValues((p) => ({ ...p, name: v }))} error={errors.name?.[0]} />
          <FormField field={{ key: 'min_score', id: 'grade_min', label: 'Min Score', type: 'number', required: true }} value={values.min_score} onChange={(v) => setValues((p) => ({ ...p, min_score: v }))} error={errors.min_score?.[0]} />
          <FormField field={{ key: 'max_score', id: 'grade_max', label: 'Max Score', type: 'number', required: true }} value={values.max_score} onChange={(v) => setValues((p) => ({ ...p, max_score: v }))} error={errors.max_score?.[0]} />
          <FormField field={{ key: 'remark', id: 'grade_remark', label: 'Remark (e.g. Excellent)', type: 'text', required: true }} value={values.remark} onChange={(v) => setValues((p) => ({ ...p, remark: v }))} error={errors.remark?.[0]} />
          <FormField field={{ key: 'grade_point', id: 'grade_point', label: 'Grade Point (optional)', type: 'number' }} value={values.grade_point} onChange={(v) => setValues((p) => ({ ...p, grade_point: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Grade'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Grade?" message="This can't be undone." loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Card>
  );
}

function ExamSettingsCard() {
  const [minBankSize, setMinBankSize] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    api.get('/exam/settings')
      .then((data) => setMinBankSize(String(data.min_bank_size)))
      .catch(() => setLoadError('Could not load exam settings.'))
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const result = await api.post('/exam/settings', { min_bank_size: minBankSize });
      setMinBankSize(String(result.min_bank_size));
      setSaveMessage('Saved.');
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-3xl">
      <h2 className="font-headline-md text-headline-md text-primary mb-md">Exam &amp; CBE Settings</h2>
      {!loaded ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      ) : loadError ? (
        <p className="font-label-md text-label-md text-error">{loadError}</p>
      ) : (
        <div className="space-y-md">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="minBankSize">
              Minimum Question Bank Size
            </label>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-sm">
              A question bank can't be approved for use in a CBE exam until it has at least this many questions. Also editable by the Exam Officer.
            </p>
            <input
              id="minBankSize"
              type="number"
              min="1"
              value={minBankSize}
              onChange={(e) => setMinBankSize(e.target.value)}
              className="mcss-field px-md w-40"
            />
          </div>
          {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{saveError}</p>}
          {saveMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">{saveMessage}</p>}
          <div className="flex justify-end">
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving || !minBankSize}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SuperAdminAcademicSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await api.put('/settings/bulk', Object.entries(values).map(([key, value]) => ({ key, value })));
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell loading={loading} error={error} onReload={reload}>
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Academic sessions, terms, classes, and departments are managed in Administration.
            </p>
            <div className="flex gap-sm">
              <Link to="/super-admin/administration/academic-session-terms" className="font-label-sm text-label-sm text-primary hover:underline">Academic Sessions & Terms →</Link>
              <Link to="/super-admin/administration/classes-arms" className="font-label-sm text-label-sm text-primary hover:underline">Classes & Arms →</Link>
            </div>
          </Card>

          <GradeScalesCard grades={data.grades} reload={reload} />

          <ExamSettingsCard />

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved.</p>}
            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Rules & Defaults</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {RULE_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>
            <div className="flex justify-end max-w-3xl">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      )}
    </SectionShell>
  );
}
