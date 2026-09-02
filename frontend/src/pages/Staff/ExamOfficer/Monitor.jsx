import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../../lib/api.js';

const ENDPOINTS = { exams: '/exam/exams?status=active' };
const STATUS_TONE = {
  in_progress: 'warning', submitted: 'success',
  auto_submitted_timeout: 'error', auto_submitted_exit: 'error', reset: 'secondary',
};
const STATUS_LABEL = {
  in_progress: 'Writing', submitted: 'Submitted',
  auto_submitted_timeout: 'Timed out', auto_submitted_exit: 'Left page', reset: 'Reset',
};

export default function ExamOfficerMonitor() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const activeExams = data?.exams || [];
  const [selectedId, setSelectedId] = useState('');
  const [monitor, setMonitor] = useState(null);

  const selected = selectedId || activeExams[0]?.id || '';

  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleReset = async () => {
    setResetting(true);
    setResetError('');
    try {
      await api.post(`/exam/attempts/${resetTarget.id}/reset`, { reason: 'Technical failure — reset from Live Monitor' });
      setResetTarget(null);
      const result = await api.get(`/exam/exams/${selected}/monitor`);
      setMonitor(result);
    } catch (err) {
      setResetError(err.message || 'Could not reset this attempt.');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    if (!selected) { setMonitor(null); return; }
    let cancelled = false;
    const poll = async () => {
      try {
        const result = await api.get(`/exam/exams/${selected}/monitor`);
        if (!cancelled) setMonitor(result);
      } catch { /* transient poll failure — next tick retries */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selected]);

  return (
    <DashboardPageShell
      portalId="examOfficer"
      pageTitle="Live Monitor"
      title="Live Monitor"
      subtitle="Who's writing, who's submitted — refreshes automatically every few seconds."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        activeExams.length === 0 ? (
          <Card padding="lg"><EmptyState icon="monitoring" text="No exam is live right now." /></Card>
        ) : (
          <div>
            <select value={selected} onChange={(e) => setSelectedId(e.target.value)} className="mcss-field px-md w-auto mb-md">
              {activeExams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>

            {!monitor ? (
              <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-md">
                  <Card padding="lg">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Currently Writing</p>
                    <p className="font-headline-lg text-headline-lg text-tertiary mt-1">{monitor.writing_count}</p>
                  </Card>
                  <Card padding="lg">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Submitted / Closed</p>
                    <p className="font-headline-lg text-headline-lg text-secondary mt-1">{monitor.submitted_count}</p>
                  </Card>
                </div>

                {monitor.attempts.length === 0 ? (
                  <Card padding="lg"><EmptyState icon="groups" text="No one has started this exam yet." /></Card>
                ) : (
                  <Card padding="none">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-125 text-left border-collapse">
                        <thead>
                          <tr className="bg-primary text-on-primary">
                            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Started</th>
                            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline/10">
                          {monitor.attempts.map((a) => (
                            <tr key={a.id}>
                              <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{a.student_name}</td>
                              <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{new Date(a.started_at).toLocaleTimeString()}</td>
                              <td className="px-lg py-3"><Badge tone={STATUS_TONE[a.status] || 'secondary'}>{STATUS_LABEL[a.status] || a.status}</Badge></td>
                              <td className="px-lg py-3 text-right">
                                {a.status !== 'reset' && (
                                  <button type="button" onClick={() => setResetTarget(a)} title="Grant a fresh attempt" className="font-label-sm text-label-sm text-error hover:underline">
                                    Reset
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )
      )}

      <ConfirmDialog
        open={!!resetTarget}
        title="Reset This Attempt?"
        message={`This can't be undone. ${resetTarget?.student_name}'s current answers are discarded entirely — their next Start Attempt draws a brand-new random question set. Only do this for a genuine technical failure.${resetError ? ` ${resetError}` : ''}`}
        confirmLabel="Reset"
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetTarget(null)}
      />
    </DashboardPageShell>
  );
}
