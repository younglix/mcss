import { useMemo, useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const ENDPOINTS = { classes: '/academics/teaching/classes', exams: '/academics/teaching/exams' };

export default function TeacherStudentPerformance() {
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
  const scores = [...(scoresData.data?.payload?.scores || [])].sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));

  const stats = scores.length ? {
    average: Math.round((scores.reduce((sum, s) => sum + Number(s.percentage || 0), 0) / scores.length) * 10) / 10,
    highest: Math.max(...scores.map((s) => Number(s.percentage || 0))),
    lowest: Math.min(...scores.map((s) => Number(s.percentage || 0))),
  } : null;

  return (
    <AppShell portalId="teacher" pageTitle="Student Performance" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Student Performance" subtitle="How your students are ranking on a given exam." />

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
          <Card padding="lg"><EmptyState icon="insights" text="Select a class, subject, and exam to see performance." /></Card>
        ) : scores.length === 0 ? (
          <Card padding="lg"><EmptyState icon="insights" text="No scores entered for this selection yet." /></Card>
        ) : (
          <div>
            {stats && (
              <div className="grid gap-lg sm:grid-cols-3 mb-md">
                <Card padding="lg"><p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Average</p><p className="font-headline-md text-headline-md text-primary mt-1">{stats.average}%</p></Card>
                <Card padding="lg"><p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Highest</p><p className="font-headline-md text-headline-md text-secondary mt-1">{stats.highest}%</p></Card>
                <Card padding="lg"><p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Lowest</p><p className="font-headline-md text-headline-md text-error mt-1">{stats.lowest}%</p></Card>
              </div>
            )}
            <Card padding="lg">
              <div className="space-y-sm">
                {scores.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-md">
                    <span className="font-label-md text-label-md text-on-surface-variant w-8 shrink-0">#{i + 1}</span>
                    <span className="font-body-md text-body-md text-on-surface flex-1 min-w-0 truncate">{s.student_name}</span>
                    <div className="w-32 h-2 rounded-full bg-outline/10 overflow-hidden shrink-0">
                      <div className={`h-full ${Number(s.percentage) >= 50 ? 'bg-primary' : 'bg-error'}`} style={{ width: `${Math.min(100, Number(s.percentage) || 0)}%` }} />
                    </div>
                    <span className="font-label-md text-label-md text-primary w-14 text-right shrink-0">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
