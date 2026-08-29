import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/** Shared engine behind Tests & CA / Exams / Marks Entry — all three are the
 * same class→subject→exam score-entry workflow, differing only in which
 * exam types the exam picker starts filtered to (see the thin wrapper pages
 * next to this file). Class Teacher / Attendance / Assignments each get
 * their own page since those workflows genuinely differ, but score entry
 * doesn't change shape just because the exam is a CA test vs the final. */
export default function MarksEntryView({ title, subtitle, examTypeFilter }) {
  const ENDPOINTS = useMemo(
    () => ({ classes: '/academics/teaching/classes', exams: `/academics/teaching/exams${examTypeFilter ? `?exam_type=${examTypeFilter}` : ''}` }),
    [examTypeFilter],
  );
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const classes = data?.classes || [];
  const exams = data?.exams || [];

  const [armId, setArmId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examId, setExamId] = useState('');
  const ready = armId && subjectId && examId;

  const subjectsForArm = classes.find((c) => c.id === armId)?.subjects || [];

  const rosterEndpoint = `/academics/teaching/students?class_arm=${armId || NIL_UUID}`;
  const scoresEndpoint = `/academics/teaching/exams/${examId || NIL_UUID}/scores?subject=${subjectId || NIL_UUID}&class_arm=${armId || NIL_UUID}`;
  const rosterData = useDashboardData(useMemo(() => ({ roster: rosterEndpoint, scoresPayload: scoresEndpoint }), [rosterEndpoint, scoresEndpoint]));
  const roster = rosterData.data?.roster || [];
  // Memoized on rosterData.data itself (which only changes identity when a
  // fetch actually completes) rather than falling back to a fresh `[]`
  // inline on every render — that fallback re-triggers the useEffect below
  // on every single render since its dependency array sees a "new" array
  // each time, an infinite render loop (finding this via the "Maximum
  // update depth exceeded" console error, not by inspection).
  const existingScores = useMemo(() => rosterData.data?.scoresPayload?.scores || [], [rosterData.data]);
  const submission = rosterData.data?.scoresPayload?.submission;
  const locked = !!submission;

  const [rowsByStudent, setRowsByStudent] = useState({});
  const [maxScore, setMaxScore] = useState(100);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const next = {};
    for (const s of existingScores) next[s.student] = { ca_score: s.ca_score ?? '', exam_score: s.exam_score ?? '', score: s.score };
    setRowsByStudent(next);
    if (existingScores.length) setMaxScore(existingScores[0].max_score);
  }, [existingScores]);

  // Deliberately separate from the effect above: existingScores also
  // changes identity on the reload() a successful save triggers, which
  // would otherwise wipe the "Scores saved" message before it's seen.
  // Clearing on the picker selection itself is what a fresh context
  // actually calls for.
  useEffect(() => {
    setSaveMessage('');
    setSaveError('');
  }, [armId, subjectId, examId]);

  const updateRow = (studentId, field, value) => {
    setRowsByStudent((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const scores = roster
        .map((s) => ({ student: s.id, row: rowsByStudent[s.id] || {} }))
        .filter(({ row }) => (row.ca_score !== '' && row.ca_score !== undefined && row.exam_score !== '' && row.exam_score !== undefined) || (row.score !== '' && row.score !== undefined))
        .map(({ student, row }) => {
          if (row.ca_score !== '' && row.ca_score !== undefined && row.exam_score !== '' && row.exam_score !== undefined) {
            return { student, ca_score: row.ca_score, exam_score: row.exam_score };
          }
          return { student, score: row.score };
        });
      const result = await api.post(`/academics/teaching/exams/${examId}/scores`, { subject: subjectId, class_arm: armId, max_score: maxScore, scores });
      setSaveMessage(`Scores saved for ${result.count} student(s).`);
      rosterData.reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save scores.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setSaveError('');
    try {
      await api.post(`/academics/teaching/exams/${examId}/submit`, { subject: subjectId, class_arm: armId });
      setSaveMessage('Submitted for approval.');
      rosterData.reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not submit for approval.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-lg sm:space-y-xl">
      <PageHeader title={title} subtitle={subtitle} />

      {error && (
        <Card padding="lg" className="border border-error/30 bg-error-container/10">
          <p className="font-body-md text-body-md text-on-surface">{error}</p>
        </Card>
      )}

      {!loading && (
        <div className="flex items-center gap-sm flex-wrap">
          <select value={armId} onChange={(e) => { setArmId(e.target.value); setSubjectId(''); }} className="mcss-field px-md w-auto">
            <option value="">Select a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
          </select>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!armId} className="mcss-field px-md w-auto disabled:opacity-50">
            <option value="">Select a subject…</option>
            {subjectsForArm.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="mcss-field px-md w-auto">
            <option value="">Select an exam…</option>
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
      ) : !ready ? (
        <Card padding="lg"><EmptyState icon="grading" text="Select a class, subject, and exam to enter scores." /></Card>
      ) : roster.length === 0 ? (
        <Card padding="lg"><EmptyState icon="grading" text="No students in this class yet." /></Card>
      ) : (
        <div>
          {locked && (
            <p className="font-label-md text-label-md text-tertiary bg-tertiary-container/20 border border-tertiary/20 rounded-lg px-md py-sm mb-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Submitted for approval on {new Date(submission.submitted_at).toLocaleDateString()}. Ask an admin to reopen it before editing further.
            </p>
          )}
          {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{saveError}</p>}
          {saveMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{saveMessage}</p>}
          <div className="flex items-center gap-sm mb-md">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Max Score (when entering a single total):</label>
            <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} disabled={locked} className="mcss-field px-sm py-1 w-24 disabled:opacity-50" />
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">CA</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Exam</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Total (if not using CA/Exam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {roster.map((s) => {
                    const row = rowsByStudent[s.id] || {};
                    const splitActive = row.ca_score !== '' && row.ca_score !== undefined && row.exam_score !== '' && row.exam_score !== undefined;
                    return (
                      <tr key={s.id}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.full_name}</td>
                        <td className="px-lg py-3">
                          <input type="number" min="0" disabled={locked} value={row.ca_score ?? ''} onChange={(e) => updateRow(s.id, 'ca_score', e.target.value)} className="mcss-field px-sm py-1 w-20 disabled:opacity-50" />
                        </td>
                        <td className="px-lg py-3">
                          <input type="number" min="0" disabled={locked} value={row.exam_score ?? ''} onChange={(e) => updateRow(s.id, 'exam_score', e.target.value)} className="mcss-field px-sm py-1 w-20 disabled:opacity-50" />
                        </td>
                        <td className="px-lg py-3">
                          <input
                            type="number" min="0" max={maxScore} disabled={locked || splitActive}
                            value={splitActive ? Number(row.ca_score) + Number(row.exam_score) : row.score ?? ''}
                            onChange={(e) => updateRow(s.id, 'score', e.target.value)}
                            className="mcss-field px-sm py-1 w-24 disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex justify-end items-center gap-sm mt-md">
            {locked && <Badge tone="tertiary">Submitted</Badge>}
            <Button variant="secondary" onClick={handleSubmitForApproval} disabled={locked || submitting || saving}>
              {submitting ? 'Submitting…' : 'Submit for Approval'}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={locked || saving}>
              {saving ? 'Saving…' : 'Save Scores'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
