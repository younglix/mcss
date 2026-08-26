import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/classes', sessions: '/config/sessions' };
const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const OUTCOMES = [
  { value: 'promoted', label: 'Promoted' },
  { value: 'repeated', label: 'Repeated' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'withdrawn', label: 'Withdrawn' },
];
const OUTCOME_TONE = { promoted: 'success', repeated: 'warning', graduated: 'primary', withdrawn: 'secondary' };

export default function SuperAdminPromotion() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const arms = data?.classes || [];
  const sessions = data?.sessions || [];
  const currentSession = sessions.find((s) => s.is_current);

  const [fromArm, setFromArm] = useState('');
  const [toSession, setToSession] = useState('');
  const rosterEndpoint = `/academics/students?class_arm=${fromArm || NIL_UUID}`;
  const rosterData = useDashboardData(useMemo(() => ({ roster: rosterEndpoint }), [rosterEndpoint]));
  const roster = rosterData.data?.roster || [];

  const historyEndpoint = `/academics/promotion/records?from_class_arm=${fromArm || NIL_UUID}`;
  const historyData = useDashboardData(useMemo(() => ({ records: historyEndpoint }), [historyEndpoint]));
  const history = historyData.data?.records || [];

  const [decisions, setDecisions] = useState({}); // { studentId: { outcome, to_class_arm } }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const setDecision = (studentId, patch) =>
    setDecisions((prev) => ({ ...prev, [studentId]: { outcome: 'promoted', to_class_arm: '', ...prev[studentId], ...patch } }));

  const handleSubmit = async () => {
    if (!currentSession || !toSession) return;
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const decisionList = roster
        .filter((s) => decisions[s.id]?.outcome)
        .map((s) => ({
          student: s.id,
          outcome: decisions[s.id].outcome,
          to_class_arm: decisions[s.id].outcome === 'promoted' ? decisions[s.id].to_class_arm : undefined,
        }));
      if (decisionList.length === 0) {
        setSaveError('Choose an outcome for at least one student.');
        return;
      }
      const result = await api.post('/academics/promotion/action', {
        from_class_arm: fromArm, from_session: currentSession.id, to_session: toSession, decisions: decisionList,
      });
      setSaveMessage(`Processed ${result.length} student(s).`);
      setDecisions({});
      rosterData.reload();
      historyData.reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not process promotion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Promotion" title="Promotion" subtitle="Move students from a class into the next academic session." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div className="space-y-lg">
          <div className="flex items-center gap-sm flex-wrap">
            <select id="class-picker" value={fromArm} onChange={(e) => setFromArm(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">From class…</option>
              {arms.map((arm) => <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>)}
            </select>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {currentSession ? `Current: ${currentSession.name}` : 'No current session set'}
            </span>
            <select id="session-picker" value={toSession} onChange={(e) => setToSession(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">To session…</option>
              {sessions.filter((s) => s.id !== currentSession?.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {!fromArm ? (
            <Card padding="lg">
              <EmptyState icon="trending_up" text="Select a class to begin." />
            </Card>
          ) : roster.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="trending_up" text="No data available yet" />
            </Card>
          ) : (
            <div>
              {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{saveError}</p>}
              {saveMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{saveMessage}</p>}
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Outcome</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">New Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {roster.map((s) => {
                        const decision = decisions[s.id] || { outcome: 'promoted', to_class_arm: '' };
                        return (
                          <tr key={s.id}>
                            <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.full_name}</td>
                            <td className="px-lg py-3">
                              <select value={decision.outcome} onChange={(e) => setDecision(s.id, { outcome: e.target.value })} className="mcss-field px-sm py-1 text-label-sm w-auto">
                                {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>
                            <td className="px-lg py-3">
                              {decision.outcome === 'promoted' && (
                                <select value={decision.to_class_arm} onChange={(e) => setDecision(s.id, { to_class_arm: e.target.value })} className="mcss-field px-sm py-1 text-label-sm w-auto">
                                  <option value="">Select…</option>
                                  {arms.map((arm) => <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>)}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="flex justify-end mt-md">
                <Button variant="primary" onClick={handleSubmit} disabled={saving || !toSession}>
                  {saving ? 'Processing…' : 'Process Promotion'}
                </Button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Promotion History</h3>
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Student</th>
                        <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Outcome</th>
                        <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">New Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {history.map((r) => (
                        <tr key={r.id}>
                          <td className="px-lg py-2 font-body-md text-body-md text-on-surface">{r.student_name}</td>
                          <td className="px-lg py-2"><Badge tone={OUTCOME_TONE[r.outcome] || 'secondary'}>{r.outcome}</Badge></td>
                          <td className="px-lg py-2 font-label-sm text-label-sm text-on-surface-variant">{r.to_class_arm_label || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
