import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/config/classes', configs: '/academics/banding-config', reallocations: '/academics/reallocations', exams: '/academics/exams' };

const STATUS_TONE = { pending: 'warning', released: 'secondary', applied: 'success', superseded: 'secondary' };

/** One class's row: enable/disable banding, pick its N_S holding arm, and
 * see/edit each arm's capacity. Arms are fetched lazily per row (only once
 * expanded) rather than all 14 classes' arms up front. */
function ClassRow({ klass, config, onConfigSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [arms, setArms] = useState(null);
  const [armsError, setArmsError] = useState('');
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [holdingArmId, setHoldingArmId] = useState(config?.holding_arm || '');
  const [savingHolding, setSavingHolding] = useState(false);
  const [capacityDrafts, setCapacityDrafts] = useState({});
  const [savingCapacity, setSavingCapacity] = useState(null);

  useEffect(() => setHoldingArmId(config?.holding_arm || ''), [config?.holding_arm]);

  const loadArms = () => {
    setArmsError('');
    api.get(`/config/classes/${klass.id}/arms`)
      .then(setArms)
      .catch((err) => setArmsError(err instanceof ApiError ? err.message : 'Could not load this class\'s arms.'));
  };

  const toggleExpanded = () => {
    setExpanded((v) => !v);
    if (!arms) loadArms();
  };

  const toggleEnabled = async () => {
    setSavingEnabled(true);
    try {
      await api.patch(`/academics/banding-config/${klass.id}`, { enabled: !config.enabled });
      onConfigSaved();
    } finally {
      setSavingEnabled(false);
    }
  };

  const saveHoldingArm = async () => {
    setSavingHolding(true);
    try {
      await api.patch(`/academics/banding-config/${klass.id}`, { holding_arm: holdingArmId || null });
      onConfigSaved();
    } finally {
      setSavingHolding(false);
    }
  };

  const saveCapacity = async (armId) => {
    const value = capacityDrafts[armId];
    setSavingCapacity(armId);
    try {
      await api.put(`/academics/arms/${armId}/capacity`, { capacity: value === '' ? null : Number(value) });
      loadArms();
    } finally {
      setSavingCapacity(null);
    }
  };

  return (
    <Card padding="lg" className="space-y-md">
      <div className="flex items-center justify-between flex-wrap gap-sm">
        <button type="button" onClick={toggleExpanded} className="flex items-center gap-sm text-left">
          <span className="material-symbols-outlined text-on-surface-variant">{expanded ? 'expand_less' : 'expand_more'}</span>
          <h3 className="font-headline-md text-headline-sm text-on-surface">{klass.name}</h3>
        </button>
        <button type="button" onClick={toggleEnabled} disabled={savingEnabled}>
          <Badge tone={config?.enabled ? 'success' : 'secondary'}>{config?.enabled ? 'Banding On' : 'Banding Off'}</Badge>
        </button>
      </div>

      {expanded && (
        <div className="space-y-md pt-md border-t border-outline/10">
          {armsError && <p className="font-label-sm text-label-sm text-error">{armsError}</p>}
          {!arms && !armsError ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">Loading arms…</p>
          ) : arms ? (
            <>
              <div className="flex items-center gap-sm flex-wrap">
                <span className="font-label-sm text-label-sm text-on-surface-variant">N_S Holding Arm (new intake starts here):</span>
                <select value={holdingArmId} onChange={(e) => setHoldingArmId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
                  <option value="">None</option>
                  {arms.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={saveHoldingArm} disabled={savingHolding || holdingArmId === (config?.holding_arm || '')}>
                  {savingHolding ? 'Saving…' : 'Save'}
                </Button>
              </div>

              <div className="space-y-xs">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Arm Capacities (blank = unlimited/auto):</p>
                {arms.map((arm) => (
                  <div key={arm.id} className="flex items-center gap-sm">
                    <span className="font-label-sm text-label-sm text-on-surface w-16">{arm.name}</span>
                    <input
                      type="number"
                      min="0"
                      className="mcss-field px-sm py-1 text-label-sm w-24"
                      value={capacityDrafts[arm.id] ?? arm.capacity ?? ''}
                      onChange={(e) => setCapacityDrafts((prev) => ({ ...prev, [arm.id]: e.target.value }))}
                    />
                    <Button
                      variant="ghost" size="sm" onClick={() => saveCapacity(arm.id)}
                      disabled={savingCapacity === arm.id || capacityDrafts[arm.id] === undefined}
                    >
                      {savingCapacity === arm.id ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function ReallocationReviewDrawer({ reallocationId, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!reallocationId) return;
    setDetail(null);
    setError('');
    api.get(`/academics/reallocations/${reallocationId}`)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this reallocation.'));
  }, [reallocationId]);

  const act = async (action) => {
    setActing(true);
    setError('');
    try {
      await api.post(`/academics/reallocations/${reallocationId}/${action}`, {});
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setActing(false);
    }
  };

  return (
    <Drawer open={!!reallocationId} onClose={onClose} title={detail ? `${detail.school_class_name} — ${detail.term_name}` : 'Reallocation'}>
      {error && <p className="font-label-md text-label-md text-error mb-md">{error}</p>}
      {!detail ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-lg">
          <div className="flex items-center gap-sm">
            <Badge tone={STATUS_TONE[detail.status]}>{detail.status}</Badge>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{detail.move_count} move(s)</span>
          </div>

          <div>
            <p className="font-label-md text-label-md text-on-surface mb-xs">Per-Band Summary</p>
            <div className="space-y-xs">
              {(detail.arm_summary || []).map((s) => (
                <div key={s.arm_id} className="flex items-center justify-between font-label-sm text-label-sm">
                  <span>{s.arm}</span>
                  <span className="text-on-surface-variant">{s.current_count} → {s.proposed_count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-label-md text-label-md text-on-surface mb-xs">Moves</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {detail.moves.map((m) => (
                <div key={m.id} className="flex items-center justify-between font-label-sm text-label-sm border-b border-outline/10 py-1">
                  <span>{m.student_name}</span>
                  <span className="text-on-surface-variant">{m.from_arm_label || '—'} → {m.to_arm_label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            {detail.status === 'pending' && (
              <Button variant="primary" onClick={() => act('release')} disabled={acting}>
                {acting ? 'Releasing…' : 'Release'}
              </Button>
            )}
            {detail.status === 'released' && (
              <Button variant="primary" onClick={() => act('apply')} disabled={acting}>
                {acting ? 'Applying…' : 'Apply Now'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function SuperAdminClassBanding() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [reviewingId, setReviewingId] = useState(null);
  const [computeOpen, setComputeOpen] = useState(false);
  const [computeForm, setComputeForm] = useState({ school_class: '', source_exam: '', kind: 'reallocation' });
  const [computing, setComputing] = useState(false);
  const [computeError, setComputeError] = useState('');

  const classes = data?.classes || [];
  const configs = data?.configs || [];
  const reallocations = data?.reallocations || [];
  const configByClass = Object.fromEntries(configs.map((c) => [c.school_class, c]));
  const liveReallocations = reallocations.filter((r) => r.status === 'pending' || r.status === 'released');

  const handleCompute = async (e) => {
    e.preventDefault();
    setComputing(true);
    setComputeError('');
    try {
      await api.post('/academics/reallocations/compute', computeForm);
      setComputeOpen(false);
      reload();
    } catch (err) {
      setComputeError(err instanceof ApiError ? err.message : 'Could not compute a reallocation.');
    } finally {
      setComputing(false);
    }
  };

  return (
    <DashboardPageShell
      pageTitle="Class Arm Banding"
      title="Class Arm Banding"
      subtitle="Performance-based A/B/C arm reallocation. New students start in a class's N_S arm and get placed into a band once they have a term average; turn banding on per class below."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={3}
    >
      {data && (
        <div className="space-y-lg">
          <div className="flex justify-end">
            <Button variant="secondary" iconLeft="calculate" onClick={() => setComputeOpen(true)}>
              Compute Manually
            </Button>
          </div>

          <div className="space-y-md">
            {classes.map((klass) => (
              <ClassRow key={klass.id} klass={klass} config={configByClass[klass.id]} onConfigSaved={reload} />
            ))}
          </div>

          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Pending &amp; Released Reallocations</h2>
            {liveReallocations.length === 0 ? (
              <Card padding="lg"><EmptyState icon="sync_alt" text="Nothing awaiting review right now." /></Card>
            ) : (
              <div className="space-y-sm">
                {liveReallocations.map((r) => (
                  <Card key={r.id} padding="lg" className="flex items-center justify-between flex-wrap gap-sm">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">{r.school_class_name} — {r.term_name} ({r.session_name})</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{r.move_count} move(s), from {r.source_exam_name || 'manual compute'}</p>
                    </div>
                    <div className="flex items-center gap-sm">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setReviewingId(r.id)}>Review</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ReallocationReviewDrawer reallocationId={reviewingId} onClose={() => setReviewingId(null)} onChanged={reload} />

      <Drawer open={computeOpen} onClose={() => setComputeOpen(false)} title="Compute Reallocation Manually">
        <form onSubmit={handleCompute} className="space-y-lg">
          {computeError && <p className="font-label-md text-label-md text-error">{computeError}</p>}
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Class</label>
            <select
              className="mcss-field w-full px-md" value={computeForm.school_class}
              onChange={(e) => setComputeForm((prev) => ({ ...prev, school_class: e.target.value }))} required
            >
              <option value="" disabled>Select…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Source Exam</label>
            <select
              className="mcss-field w-full px-md" value={computeForm.source_exam}
              onChange={(e) => setComputeForm((prev) => ({ ...prev, source_exam: e.target.value }))} required
            >
              <option value="" disabled>Select…</option>
              {(data?.exams || []).map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Kind</label>
            <select
              className="mcss-field w-full px-md" value={computeForm.kind}
              onChange={(e) => setComputeForm((prev) => ({ ...prev, kind: e.target.value }))}
            >
              <option value="reallocation">Reallocation (rerank + N_S absorption)</option>
              <option value="initial_banding">Initial Banding (cold start / promoted cohort)</option>
            </select>
          </div>
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setComputeOpen(false)} disabled={computing}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={computing}>{computing ? 'Computing…' : 'Compute'}</Button>
          </div>
        </form>
      </Drawer>
    </DashboardPageShell>
  );
}
