import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = {
  exams: '/exam/exams', banks: '/exam/banks', classes: '/config/classes',
  subjects: '/academics/subjects', academicExams: '/academics/exams',
};
const STATUS_TONE = { draft: 'secondary', active: 'success', ended: 'primary' };
const EMPTY_FORM = {
  title: '', academic_exam: '', subject: '', school_class: '', bank: '',
  questions_per_student: 50, duration_minutes: 30, auto_submit_penalty: 5, total_marks: 50,
};

export default function ExamOfficerExams() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const exams = data?.exams || [];
  const banks = data?.banks || [];
  const classes = data?.classes || [];
  const subjects = data?.subjects || [];
  const academicExams = data?.academicExams || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [activatedExam, setActivatedExam] = useState(null); // shows the access-code reveal dialog
  const [busyId, setBusyId] = useState(null);
  const [endTarget, setEndTarget] = useState(null);
  const [ending, setEnding] = useState(false);
  const [actionError, setActionError] = useState('');

  const approvedBanksFor = (subjectId, schoolClassId) =>
    banks.filter((b) => b.is_approved && b.subject === subjectId && b.school_class === schoolClassId);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    try {
      await api.post('/exam/exams', form);
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this exam.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (exam) => {
    setBusyId(exam.id);
    setActionError('');
    try {
      const result = await api.post(`/exam/exams/${exam.id}/activate`, {});
      setActivatedExam(result);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not activate this exam.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    setActionError('');
    try {
      await api.post(`/exam/exams/${endTarget.id}/end`, {});
      setEndTarget(null);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not end this exam.');
    } finally {
      setEnding(false);
    }
  };

  const bankOptions = useMemo(
    () => approvedBanksFor(form.subject, form.school_class).map((b) => ({ value: b.id, label: `${b.question_count} question(s)` })),
    [banks, form.subject, form.school_class],
  );

  return (
    <DashboardPageShell
      portalId="examOfficer"
      pageTitle="CBE Exams"
      title="CBE Exams"
      subtitle="Configure a computer-based exam off an approved question bank, then activate it when the hall is ready."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          {actionError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{actionError}</p>}
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openCreate}>New Exam</Button>
          </div>

          {exams.length === 0 ? (
            <Card padding="lg"><EmptyState icon="laptop_chromebook" text="No CBE exams configured yet." /></Card>
          ) : (
            <div className="space-y-md">
              {exams.map((exam) => (
                <Card key={exam.id} padding="lg">
                  <div className="flex items-center justify-between gap-md flex-wrap">
                    <div>
                      <h3 className="font-headline-md text-headline-sm text-on-surface">{exam.title}</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {exam.subject_name} · {exam.school_class_name}{exam.class_arm_label ? ` ${exam.class_arm_label}` : ''} · {exam.academic_exam_name}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {exam.questions_per_student} questions · {exam.duration_minutes} min · −{exam.auto_submit_penalty} auto-submit penalty · {exam.attempt_count} attempt(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-sm">
                      <Badge tone={STATUS_TONE[exam.status] || 'secondary'}>{exam.status}</Badge>
                      {exam.status === 'draft' && (
                        <Button variant="primary" size="sm" iconLeft="play_arrow" onClick={() => handleActivate(exam)} disabled={busyId === exam.id}>
                          {busyId === exam.id ? 'Activating…' : 'Activate'}
                        </Button>
                      )}
                      {exam.status === 'active' && (
                        <Button variant="secondary" size="sm" iconLeft="stop" onClick={() => setEndTarget(exam)}>End</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New CBE Exam"
        footer={(
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.title || !form.academic_exam || !form.subject || !form.school_class || !form.bank}>
            {saving ? 'Creating…' : 'Create Exam'}
          </Button>
        )}
      >
        <div className="space-y-md">
          {formError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{formError}</p>}
          <FormField field={{ key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. First Term Mathematics CBE' }} value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} />
          <FormField
            field={{ key: 'academic_exam', label: 'School Exam Period', type: 'select', required: true, options: academicExams.map((e) => ({ value: e.id, label: e.name })) }}
            value={form.academic_exam} onChange={(v) => setForm((p) => ({ ...p, academic_exam: v }))}
          />
          <FormField
            field={{ key: 'school_class', label: 'Class', type: 'select', required: true, options: classes.map((c) => ({ value: c.id, label: c.name })) }}
            value={form.school_class} onChange={(v) => setForm((p) => ({ ...p, school_class: v, bank: '' }))}
          />
          <FormField
            field={{ key: 'subject', label: 'Subject', type: 'select', required: true, options: subjects.map((s) => ({ value: s.id, label: s.name })) }}
            value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v, bank: '' }))}
          />
          <FormField
            field={{ key: 'bank', label: 'Approved Question Bank', type: 'select', required: true, options: bankOptions }}
            value={form.bank} onChange={(v) => setForm((p) => ({ ...p, bank: v }))}
          />
          {form.subject && form.school_class && bankOptions.length === 0 && (
            <p className="font-label-sm text-label-sm text-error">No approved bank for this subject/class yet — approve one first.</p>
          )}
          <FormField field={{ key: 'questions_per_student', label: 'Questions per Student', type: 'number', required: true }} value={form.questions_per_student} onChange={(v) => setForm((p) => ({ ...p, questions_per_student: v }))} />
          <FormField field={{ key: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: true }} value={form.duration_minutes} onChange={(v) => setForm((p) => ({ ...p, duration_minutes: v }))} />
          <FormField field={{ key: 'auto_submit_penalty', label: 'Auto-Submit Penalty (marks off raw score)', type: 'number', required: true }} value={form.auto_submit_penalty} onChange={(v) => setForm((p) => ({ ...p, auto_submit_penalty: v }))} />
          <FormField field={{ key: 'total_marks', label: 'Total Marks', type: 'number', required: true }} value={form.total_marks} onChange={(v) => setForm((p) => ({ ...p, total_marks: v }))} />
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!activatedExam}
        title="Exam is Live"
        message={`Access code: ${activatedExam?.access_code} — share this verbally in the hall. It expires the moment you end this exam.`}
        confirmLabel="Got it"
        danger={false}
        onConfirm={() => setActivatedExam(null)}
        onCancel={() => setActivatedExam(null)}
      />

      <ConfirmDialog
        open={!!endTarget}
        title="End This Exam?"
        message={`The access code expires immediately, and any student still writing "${endTarget?.title}" will be auto-submitted. This can't be undone.`}
        confirmLabel="End Exam"
        loading={ending}
        onConfirm={handleEnd}
        onCancel={() => setEndTarget(null)}
      />
    </DashboardPageShell>
  );
}
