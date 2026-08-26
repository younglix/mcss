import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { exams: '/academics/exams', classes: '/academics/classes', subjects: '/academics/subjects' };
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export default function SuperAdminResults() {
  const [searchParams] = useSearchParams();
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const exams = data?.exams || [];
  const arms = data?.classes || [];
  const subjects = data?.subjects || [];

  const [examId, setExamId] = useState(searchParams.get('exam') || '');
  const [armId, setArmId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const ready = examId && armId && subjectId;

  const rosterEndpoint = `/academics/students?class_arm=${armId || NIL_UUID}`;
  const scoresEndpoint = `/academics/exams/${examId || NIL_UUID}/scores?subject=${subjectId || NIL_UUID}&class_arm=${armId || NIL_UUID}`;
  const rosterData = useDashboardData(useMemo(() => ({ roster: rosterEndpoint, scores: scoresEndpoint }), [rosterEndpoint, scoresEndpoint]));
  const roster = rosterData.data?.roster || [];
  const existingScores = rosterData.data?.scores || [];

  const [scoreByStudent, setScoreByStudent] = useState({});
  const [maxScore, setMaxScore] = useState(100);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [marksheetStudent, setMarksheetStudent] = useState(null);
  const [marksheet, setMarksheet] = useState(null);

  useEffect(() => {
    const next = {};
    for (const s of existingScores) next[s.student] = s.score;
    setScoreByStudent(next);
    if (existingScores.length) setMaxScore(existingScores[0].max_score);
  }, [existingScores]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const scores = roster
        .filter((s) => scoreByStudent[s.id] !== undefined && scoreByStudent[s.id] !== '')
        .map((s) => ({ student: s.id, score: scoreByStudent[s.id] }));
      const result = await api.post(`/academics/exams/${examId}/scores`, { subject: subjectId, max_score: maxScore, scores });
      setSaveMessage(`Scores entered for ${result.count} student(s).`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save scores.');
    } finally {
      setSaving(false);
    }
  };

  const openMarksheet = async (student) => {
    setMarksheetStudent(student);
    setMarksheet(null);
    const result = await api.get(`/academics/exams/${examId}/marksheet/${student.id}`);
    setMarksheet(result);
  };

  return (
    <DashboardPageShell pageTitle="Results / Marksheets" title="Results / Marksheets" subtitle="Enter exam scores by class and subject, then review a student's compiled marksheet." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex items-center gap-sm flex-wrap mb-md">
            <select id="exam-picker" value={examId} onChange={(e) => setExamId(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select an exam…</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <select id="class-picker" value={armId} onChange={(e) => setArmId(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a class…</option>
              {arms.map((arm) => <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>)}
            </select>
            <select id="subject-picker" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {!ready ? (
            <Card padding="lg">
              <EmptyState icon="grading" text="Select an exam, class, and subject to enter scores." />
            </Card>
          ) : roster.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="grading" text="No data available yet" />
            </Card>
          ) : (
            <div>
              {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{saveError}</p>}
              {saveMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{saveMessage}</p>}
              <div className="flex items-center gap-sm mb-md">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Max Score:</label>
                <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="mcss-field px-sm py-1 w-24" />
              </div>
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Score</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Marksheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {roster.map((s) => (
                        <tr key={s.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.full_name}</td>
                          <td className="px-lg py-3">
                            <input
                              type="number"
                              min="0"
                              max={maxScore}
                              value={scoreByStudent[s.id] ?? ''}
                              onChange={(e) => setScoreByStudent((prev) => ({ ...prev, [s.id]: e.target.value }))}
                              className="mcss-field px-sm py-1 w-24"
                            />
                          </td>
                          <td className="px-lg py-3 text-right">
                            <button type="button" onClick={() => openMarksheet(s)} className="p-2 text-outline hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[20px]">description</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="flex justify-end mt-md">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Scores'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Drawer open={!!marksheetStudent} onClose={() => setMarksheetStudent(null)} title={marksheetStudent ? `Marksheet — ${marksheetStudent.full_name}` : ''}>
        {!marksheet ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
        ) : (
          <div className="space-y-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">{marksheet.exam.name} · {marksheet.student.class_arm || '—'}</p>
            {marksheet.subjects.length === 0 ? (
              <EmptyState icon="description" text="No scores entered yet." />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline/10">
                    <th className="py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Subject</th>
                    <th className="py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Score</th>
                    <th className="py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {marksheet.subjects.map((row) => (
                    <tr key={row.subject}>
                      <td className="py-2 font-body-md text-body-md text-on-surface">{row.subject}</td>
                      <td className="py-2 font-body-md text-body-md text-on-surface">{row.score}/{row.max_score} ({row.percentage}%)</td>
                      <td className="py-2 font-body-md text-body-md text-on-surface">{row.grade_info ? `${row.grade_info.grade} — ${row.grade_info.remark}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {marksheet.average !== null && (
              <p className="font-label-md text-label-md font-bold text-primary">Average: {marksheet.average}%</p>
            )}
          </div>
        )}
      </Drawer>
    </DashboardPageShell>
  );
}
