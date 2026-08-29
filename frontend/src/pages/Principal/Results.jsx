import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const STATUS_TONE = { scheduled: 'secondary', ongoing: 'warning', completed: 'primary', published: 'success' };

function ScoresViewer({ exam, classes, subjects }) {
  const [armId, setArmId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const scoresEndpoint = `/academics/exams/${exam.id}/scores?subject=${subjectId || NIL_UUID}&class_arm=${armId || NIL_UUID}`;
  const { data } = useDashboardData(useMemo(() => ({ scores: scoresEndpoint }), [scoresEndpoint]));
  const scores = data?.scores || [];

  return (
    <div className="mt-md pt-md border-t border-outline/10">
      <div className="flex items-center gap-sm flex-wrap mb-sm">
        <select value={armId} onChange={(e) => setArmId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
          <option value="">Select a class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
          <option value="">Select a subject…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {armId && subjectId && (
        scores.length === 0 ? (
          <p className="font-label-sm text-label-sm text-on-surface-variant">No scores entered for this selection yet.</p>
        ) : (
          <div className="space-y-xs">
            {scores.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-body-sm border-b border-outline/10 pb-xs">
                <span className="text-on-surface">{s.student_name}</span>
                <span className="text-on-surface-variant">{s.score}/{s.max_score} ({s.percentage}%)</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function PrincipalResults() {
  const endpoints = useMemo(() => ({ exams: '/academics/exams', classes: '/academics/classes', subjects: '/academics/subjects' }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const exams = data?.exams || [];
  const classes = data?.classes || [];
  const subjects = data?.subjects || [];

  const [expandedId, setExpandedId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const handlePublish = async (exam) => {
    setPublishingId(exam.id);
    try {
      await api.post(`/academics/exams/${exam.id}/publish`, {});
      reload();
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Examinations & Results"
      title="Examinations & Results"
      subtitle="View compiled results by class and subject, and publish an exam once it's ready."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        exams.length === 0 ? (
          <Card padding="lg"><EmptyState icon="quiz" text="No exams set up yet." /></Card>
        ) : (
          <div className="space-y-md">
            {exams.map((exam) => (
              <Card key={exam.id} padding="lg">
                <div className="flex items-center justify-between gap-md flex-wrap">
                  <div>
                    <h3 className="font-headline-md text-headline-sm text-on-surface">{exam.name}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{exam.start_date} · <span className="capitalize">{exam.exam_type}</span></p>
                  </div>
                  <div className="flex items-center gap-sm">
                    <Badge tone={STATUS_TONE[exam.status] || 'secondary'}>{exam.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === exam.id ? null : exam.id)}>
                      {expandedId === exam.id ? 'Hide Results' : 'View Results'}
                    </Button>
                    {exam.status !== 'published' && (
                      <Button variant="secondary" size="sm" iconLeft="campaign" onClick={() => handlePublish(exam)} disabled={publishingId === exam.id}>
                        {publishingId === exam.id ? 'Publishing…' : 'Publish'}
                      </Button>
                    )}
                  </div>
                </div>
                {expandedId === exam.id && <ScoresViewer exam={exam} classes={classes} subjects={subjects} />}
              </Card>
            ))}
          </div>
        )
      )}
    </DashboardPageShell>
  );
}
