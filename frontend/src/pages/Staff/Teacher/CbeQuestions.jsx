import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const ENDPOINTS = { classes: '/academics/teaching/classes', terms: '/exam/terms', banks: '/exam/banks' };

const FORMAT_HINT = `Question: What is the capital of Nigeria?
A) Lagos
B) Abuja
C) Kano
D) Ibadan
Answer: B

Question: Which of these is a noun?
A) Run
B) Quickly
C) Table
D) Beautiful
Answer: C`;

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function EditQuestionForm({ question, onSave, onCancel, saving, error }) {
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState({
    A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d,
  });
  const [correct, setCorrect] = useState(question.correct_option);

  return (
    <div className="space-y-sm">
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      <FormField field={{ key: 'text', label: 'Question', type: 'textarea', rows: 2 }} value={text} onChange={setText} />
      {OPTION_KEYS.map((letter) => (
        <div key={letter} className="flex items-center gap-sm">
          <input type="radio" checked={correct === letter} onChange={() => setCorrect(letter)} className="w-4 h-4 text-primary" title="Correct answer" />
          <input
            value={options[letter]}
            onChange={(e) => setOptions((p) => ({ ...p, [letter]: e.target.value }))}
            className="mcss-field px-sm py-1 flex-1"
            placeholder={`Option ${letter}`}
          />
        </div>
      ))}
      <div className="flex justify-end gap-sm">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary" size="sm" disabled={saving}
          onClick={() => onSave({
            text, option_a: options.A, option_b: options.B, option_c: options.C, option_d: options.D, correct_option: correct,
          })}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export default function TeacherCbeQuestions() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const classes = data?.classes || [];
  const terms = data?.terms || [];
  const banks = data?.banks || [];

  const schoolClassOptions = useMemo(() => {
    const seen = new Map();
    for (const c of classes) if (!seen.has(c.school_class)) seen.set(c.school_class, c.school_class_name);
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [classes]);

  const [schoolClassId, setSchoolClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');

  // Default to the current term the moment terms load, without stomping
  // on a deliberate manual pick later.
  useEffect(() => {
    if (!termId && terms.length) {
      setTermId((terms.find((t) => t.is_current) || terms[0]).id);
    }
  }, [terms, termId]);

  const subjectOptions = useMemo(() => {
    const seen = new Map();
    for (const c of classes) {
      if (c.school_class !== schoolClassId) continue;
      for (const s of c.subjects) if (!seen.has(s.id)) seen.set(s.id, s.name);
    }
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [classes, schoolClassId]);

  const [activeBankId, setActiveBankId] = useState('');
  const existingBank = banks.find((b) => b.subject === subjectId && b.school_class === schoolClassId && b.term === termId);
  const bankId = existingBank?.id || activeBankId;
  const picked = schoolClassId && subjectId && termId;

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreateBank = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const result = await api.post('/exam/banks', { subject: subjectId, school_class: schoolClassId, term: termId });
      setActiveBankId(result.id);
      reload();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Could not create this question bank.');
    } finally {
      setCreating(false);
    }
  };

  const detail = useDashboardData(useMemo(() => ({ bank: `/exam/banks/${bankId || NIL_UUID}` }), [bankId]));
  const bank = bankId ? detail.data?.bank : null;
  const questions = bank?.questions || [];

  const [rawText, setRawText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  const handleSubmitQuestions = async () => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitResult(null);
    try {
      const result = await api.post(`/exam/banks/${bankId}/questions`, { raw_text: rawText });
      setSubmitResult(result);
      setRawText('');
      detail.reload();
      reload();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not parse these questions.');
    } finally {
      setSubmitting(false);
    }
  };

  const [editingId, setEditingId] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleSaveEdit = async (values) => {
    setEditSaving(true);
    setEditError('');
    try {
      await api.patch(`/exam/questions/${editingId}`, values);
      setEditingId('');
      detail.reload();
      reload();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Could not save this question.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/exam/questions/${deleteTarget.id}`);
      setDeleteTarget(null);
      detail.reload();
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this question.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell portalId="teacher" pageTitle="CBE Questions" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="CBE Questions" subtitle="Build your subject's computer-based exam question bank — the Exam Officer approves it once it clears the minimum size." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {!loading && (
          <Card padding="lg">
            <div className="flex items-center gap-sm flex-wrap">
              <select value={schoolClassId} onChange={(e) => { setSchoolClassId(e.target.value); setSubjectId(''); setActiveBankId(''); }} className="mcss-field px-md w-auto">
                <option value="">Select a class…</option>
                {schoolClassOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setActiveBankId(''); }} disabled={!schoolClassId} className="mcss-field px-md w-auto disabled:opacity-50">
                <option value="">Select a subject…</option>
                {subjectOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={termId} onChange={(e) => { setTermId(e.target.value); setActiveBankId(''); }} disabled={!terms.length} className="mcss-field px-md w-auto disabled:opacity-50">
                {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : !picked ? (
          <Card padding="lg"><EmptyState icon="quiz" text="Select a class, subject, and term to start authoring." /></Card>
        ) : !bankId ? (
          <Card padding="lg">
            {createError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{createError}</p>}
            <EmptyState icon="add_box" text="No question bank yet for this class, subject, and term." />
            <div className="flex justify-center mt-md">
              <Button variant="primary" iconLeft="add" onClick={handleCreateBank} disabled={creating}>
                {creating ? 'Creating…' : 'Start This Question Bank'}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-lg">
            <Card padding="lg">
              <div className="flex items-center justify-between gap-md flex-wrap">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{questions.length} question(s) in this bank</p>
                  {bank?.is_approved && (
                    <p className="font-label-sm text-label-sm text-tertiary mt-1">Approved by {bank.approved_by_name} — adding or editing a question revokes this approval.</p>
                  )}
                </div>
                <Badge tone={bank?.is_approved ? 'success' : 'secondary'}>{bank?.is_approved ? 'Approved' : 'Pending Approval'}</Badge>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Paste New Questions</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
                One blank line between each question. Every block needs a Question line, exactly options A)–D), and an Answer line.
              </p>
              {submitError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{submitError}</p>}
              {submitResult && (
                <div className="mb-md space-y-xs">
                  {submitResult.created?.length > 0 && (
                    <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">
                      Added {submitResult.created.length} question(s).
                    </p>
                  )}
                  {submitResult.errors?.length > 0 && (
                    <div className="font-label-sm text-label-sm text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
                      {submitResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                </div>
              )}
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={10}
                placeholder={FORMAT_HINT}
                className="mcss-field w-full px-md py-sm font-mono text-body-sm resize-y"
              />
              <div className="flex justify-end mt-md">
                <Button variant="primary" onClick={handleSubmitQuestions} disabled={submitting || !rawText.trim()}>
                  {submitting ? 'Submitting…' : 'Submit Questions'}
                </Button>
              </div>
            </Card>

            {questions.length === 0 ? (
              <Card padding="lg"><EmptyState icon="quiz" text="No questions yet — paste some above to get started." /></Card>
            ) : (
              <div className="space-y-md">
                {questions.map((q, i) => (
                  <Card key={q.id} padding="lg">
                    {editingId === q.id ? (
                      <EditQuestionForm question={q} saving={editSaving} error={editError} onCancel={() => setEditingId('')} onSave={handleSaveEdit} />
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-md">
                          <p className="font-body-md text-body-md text-on-surface">{i + 1}. {q.text}</p>
                          <div className="flex items-center gap-sm shrink-0">
                            <button type="button" onClick={() => { setEditingId(q.id); setEditError(''); }} className="font-label-sm text-label-sm text-primary hover:underline">Edit</button>
                            <button type="button" onClick={() => setDeleteTarget(q)} className="font-label-sm text-label-sm text-error hover:underline">Delete</button>
                          </div>
                        </div>
                        <div className="mt-sm space-y-xs">
                          {OPTION_KEYS.map((letter) => (
                            <p key={letter} className={`font-label-sm text-label-sm ${q.correct_option === letter ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>
                              {letter}) {q[`option_${letter.toLowerCase()}`]} {q.correct_option === letter && '✓'}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete This Question?"
        message={`This can't be undone. If the bank was already approved, this revokes that approval.${deleteError ? ` ${deleteError}` : ''}`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
