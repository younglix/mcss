import { useMemo, useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/teaching/classes', exams: '/academics/teaching/exams' };
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export default function TeacherResults() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const classes = data?.classes || [];
  const exams = data?.exams || [];

  const [armId, setArmId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examId, setExamId] = useState('');
  const ready = armId && subjectId && examId;
  const subjectsForArm = classes.find((c) => c.id === armId)?.subjects || [];

  const scoresEndpoint = `/academics/teaching/exams/${examId || NIL_UUID}/scores?subject=${subjectId || NIL_UUID}&class_arm=${armId || NIL_UUID}`;
  const scoresData = useDashboardData(useMemo(() => ({ payload: scoresEndpoint }), [scoresEndpoint]));
  const scores = [...(scoresData.data?.payload?.scores || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const submission = scoresData.data?.payload?.submission;
  const average = scores.length ? Math.round((scores.reduce((sum, s) => sum + Number(s.percentage || 0), 0) / scores.length) * 10) / 10 : null;
  const passRate = scores.length ? Math.round((scores.filter((s) => Number(s.percentage || 0) >= 50).length / scores.length) * 100) : null;

  const [marksheetStudent, setMarksheetStudent] = useState(null);
  const [marksheet, setMarksheet] = useState(null);

  const openMarksheet = async (studentId, studentName) => {
    setMarksheetStudent(studentName);
    setMarksheet(null);
    const result = await api.get(`/academics/exams/${examId}/marksheet/${studentId}`);
    setMarksheet(result);
  };

  return (
    <AppShell portalId="teacher" pageTitle="Results" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Results" subtitle="Review your classes' results and submit them for HOD/principal approval." />

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
          <Card padding="lg"><EmptyState icon="leaderboard" text="Select a class, subject, and exam to review results." /></Card>
        ) : scores.length === 0 ? (
          <Card padding="lg"><EmptyState icon="leaderboard" text="No scores entered for this selection yet." /></Card>
        ) : (
          <div>
            <div className="flex items-center gap-md flex-wrap mb-md">
              {submission ? (
                <Badge tone="tertiary">Submitted for approval — {new Date(submission.submitted_at).toLocaleDateString()}</Badge>
              ) : (
                <Badge tone="secondary">Not yet submitted</Badge>
              )}
              {average !== null && <span className="font-label-md text-label-md text-on-surface-variant">Class Average: <strong className="text-primary">{average}%</strong></span>}
              {passRate !== null && <span className="font-label-md text-label-md text-on-surface-variant">Pass Rate: <strong className="text-primary">{passRate}%</strong></span>}
            </div>
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-125 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Score</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">%</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Marksheet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {scores.map((s) => (
                      <tr key={s.id}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.student_name}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.score}/{s.max_score}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.percentage}%</td>
                        <td className="px-lg py-3 text-right">
                          <button type="button" onClick={() => openMarksheet(s.student, s.student_name)} className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">description</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Drawer open={!!marksheetStudent} onClose={() => setMarksheetStudent(null)} title={marksheetStudent ? `Marksheet — ${marksheetStudent}` : ''}>
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
    </AppShell>
  );
}
