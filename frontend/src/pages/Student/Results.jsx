import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = { exams: '/academics/exams/published', profile: '/academics/students/mine' };

const SKILL_LABEL = { punctuality: 'Punctuality', neatness: 'Neatness', leadership: 'Leadership', honesty: 'Honesty' };

function SkillRating({ rating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-4 h-4 rounded-xs ${i <= rating ? 'bg-primary' : 'border border-outline/40'}`} />
      ))}
    </div>
  );
}

export default function StudentResults() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const exams = data?.exams || [];
  const profile = data?.profile;

  const [examId, setExamId] = useState('');
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (exams.length && !examId) setExamId(exams[0].id);
  }, [exams, examId]);

  useEffect(() => {
    if (!examId || !profile?.id) return;
    setReport(null);
    setReportError('');
    api.get(`/academics/exams/${examId}/report-card/${profile.id}`)
      .then(setReport)
      .catch((err) => setReportError(err.message || 'Could not load this report card.'));
  }, [examId, profile]);

  return (
    <AppShell portalId="student" pageTitle="Results" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Results / Report Card"
          subtitle="Your compiled, published results for each exam."
          actions={exams.length > 0 && (
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="mcss-field px-md w-auto">
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          )}
        />

        {(error || reportError) && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error || reportError}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : exams.length === 0 ? (
          <Card padding="lg"><EmptyState icon="grading" text="No results have been published yet." /></Card>
        ) : !report ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading report card…" /></Card>
        ) : (
          <>
            <Card padding="lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Class Position</p>
                  <p className="font-body-md font-bold text-primary">
                    {report.class_position ? `${report.class_position} of ${report.class_size}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Attendance</p>
                  <p className="font-body-md font-bold text-primary">{report.attendance.present} / {report.attendance.total} Days</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Average</p>
                  <p className="font-body-md font-bold text-primary">{report.average != null ? `${report.average}%` : '—'}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Status</p>
                  {report.status ? <Badge tone="success">{report.status}</Badge> : <p className="font-body-md text-on-surface-variant">—</p>}
                </div>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="p-sm font-label-md">Subject</th>
                      <th className="p-sm font-label-md text-center">CA</th>
                      <th className="p-sm font-label-md text-center">Exam</th>
                      <th className="p-sm font-label-md text-center">Total</th>
                      <th className="p-sm font-label-md text-center">Grade</th>
                      <th className="p-sm font-label-md">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {report.subjects.length === 0 ? (
                      <tr><td colSpan={6} className="px-lg py-6"><EmptyState icon="description" text="No scores entered yet." /></td></tr>
                    ) : report.subjects.map((s) => (
                      <tr key={s.subject}>
                        <td className="p-sm font-bold text-on-surface">{s.subject}</td>
                        <td className="p-sm text-center text-on-surface">{s.ca_score ?? '—'}</td>
                        <td className="p-sm text-center text-on-surface">{s.exam_score ?? '—'}</td>
                        <td className="p-sm text-center font-bold text-on-surface">{s.total}/{s.max_score}</td>
                        <td className="p-sm text-center text-secondary font-bold">{s.grade || '—'}</td>
                        <td className="p-sm text-on-surface-variant text-sm">{s.remark || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {report.skills.length > 0 && (
              <Card padding="lg">
                <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Psychomotor &amp; Affective Skills</h3>
                <div className="space-y-sm">
                  {report.skills.map((sk) => (
                    <div key={sk.skill} className="flex justify-between items-center text-sm">
                      <span>{SKILL_LABEL[sk.skill] || sk.skill}</span>
                      <SkillRating rating={sk.rating} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(report.class_teacher_remark || report.principal_remark) && (
              <div className="space-y-lg">
                {report.class_teacher_remark && (
                  <div className="border-l-4 border-primary pl-lg py-sm">
                    <p className="font-label-sm text-outline uppercase">Class Teacher&apos;s Remark</p>
                    <p className="font-body-md text-on-surface mt-1 italic">&ldquo;{report.class_teacher_remark}&rdquo;</p>
                  </div>
                )}
                {report.principal_remark && (
                  <div className="border-l-4 border-tertiary pl-lg py-sm">
                    <p className="font-label-sm text-outline uppercase">Principal&apos;s Comment</p>
                    <p className="font-body-md text-on-surface mt-1 italic">&ldquo;{report.principal_remark}&rdquo;</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
