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

/** Why a class can't be banded. Banding is Junior-Secondary-only (enforced
 * server-side too); Senior Secondary arms are subject streams by school
 * convention, placed by hand. */
function ineligibleNote(config) {
  if (config?.category === 'senior_secondary') {
    return 'Senior Secondary arms are subject streams (A Science, B Arts, C Commercial), assigned by hand.';
  }
  return `${config?.category_label || 'This class'}: banding is for Junior Secondary classes only.`;
}

/** One class's row: enable/disable banding, pick its N_S holding arm, and
 * see/edit each arm's capacity. Arms are fetched lazily per row (only once
 * expanded) rather than all 14 classes' arms up front. */
function ClassRow({ klass, config, onConfigSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [arms, setArms] = useState(null);
  const [armsError, setArmsError] = useState('');
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [toggleError, setToggleError] = useState('');
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
    setToggleError('');
    try {
      await api.patch(`/academics/banding-config/${klass.id}`, { enabled: !config.enabled });
      onConfigSaved();
    } catch (err) {
      setToggleError(err instanceof ApiError ? (err.errors?.enabled?.[0] || err.message) : 'Could not update banding.');
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
          {config?.category_label && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">{config.category_label}</span>
          )}
        </button>
        {config?.eligible ? (
          <button type="button" onClick={toggleEnabled} disabled={savingEnabled}>
            <Badge tone={config.enabled ? 'success' : 'secondary'}>{config.enabled ? 'Banding On' : 'Banding Off'}</Badge>
          </button>
        ) : (
          <Badge tone="secondary">Not Eligible</Badge>
        )}
      </div>
      {!config?.eligible && (
        <p className="font-label-sm text-label-sm text-on-surface-variant">{ineligibleNote(config)}</p>
      )}
      {toggleError && <p className="font-label-sm text-label-sm text-error">{toggleError}</p>}

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

  const isSuggestion = !!detail?.is_promotion_suggestion;
  let title = 'Reallocation';
  if (detail) {
    title = isSuggestion
      ? `${detail.school_class_name} to ${detail.target_class_name}: Promotion Suggestion`
      : `${detail.school_class_name}: ${detail.term_name}`;
  }

  return (
    <Drawer open={!!reallocationId} onClose={onClose} title={title}>
      {error && <p className="font-label-md text-label-md text-error mb-md">{error}</p>}
      {!detail ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-lg">
          <div className="flex items-center gap-sm">
            <Badge tone={isSuggestion ? 'primary' : STATUS_TONE[detail.status]}>{isSuggestion ? 'suggestion' : detail.status}</Badge>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{detail.move_count} student(s)</span>
          </div>

          {isSuggestion && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ranked on each student&apos;s average across all three terms of {detail.session_name}. Nothing moves from here:
              these arms pre-fill the New Class choice on the Promotion screen, where the actual move happens.
            </p>
          )}

          <div>
            <p className="font-label-md text-label-md text-on-surface mb-xs">Per-Band Summary</p>
            <div className="space-y-xs">
              {(detail.arm_summary || []).map((s) => (
                <div key={s.arm_id} className="flex items-center justify-between font-label-sm text-label-sm">
                  <span>{s.arm}</span>
                  <span className="text-on-surface-variant">
                    {s.current_count == null ? `${s.proposed_count} student(s)` : `${s.current_count} → ${s.proposed_count}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-label-md text-label-md text-on-surface mb-xs">{isSuggestion ? 'Suggested Arms' : 'Moves'}</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {detail.moves.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-sm font-label-sm text-label-sm border-b border-outline/10 py-1">
                  <span>{m.student_name}</span>
                  <span className="text-on-surface-variant text-right">
                    {m.from_arm_label || 'N/A'} → {m.to_arm_label}
                    {m.term_average != null && ` (${Number(m.term_average).toFixed(1)}%)`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            {detail.status === 'pending' && !isSuggestion && (
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
  const [computeForm, setComputeForm] = useState({ school_class: '', source_exam: '', kind: 'annual_promotion_banding' });
  const [computing, setComputing] = useState(false);
  const [computeError, setComputeError] = useState('');

  const classes = data?.classes || [];
  const configs = data?.configs || [];
  const reallocations = data?.reallocations || [];
  const configByClass = Object.fromEntries(configs.map((c) => [c.school_class, c]));
  const bandedClasses = classes.filter((c) => configByClass[c.id]?.eligible && configByClass[c.id]?.enabled);
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
      subtitle="Performance-based A/B/C arms, for Junior Secondary classes only. Once a year, when the 3rd-term result is published, each class is ranked on its students' average across all three terms, and that ranking pre-fills their arm in the next class on the Promotion screen. New students wait in the N_S arm until then."
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
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Promotion Suggestions &amp; Reallocations</h2>
            {liveReallocations.length === 0 ? (
              <Card padding="lg"><EmptyState icon="sync_alt" text="Nothing awaiting review right now." /></Card>
            ) : (
              <div className="space-y-sm">
                {liveReallocations.map((r) => (
                  <Card key={r.id} padding="lg" className="flex items-center justify-between flex-wrap gap-sm">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">
                        {r.is_promotion_suggestion
                          ? `${r.school_class_name} to ${r.target_class_name} (${r.session_name})`
                          : `${r.school_class_name} · ${r.term_name} (${r.session_name})`}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {r.is_promotion_suggestion
                          ? `${r.move_count} student(s) ranked on the full year, pre-filled on the Promotion screen`
                          : `${r.move_count} move(s), from ${r.source_exam_name || 'manual compute'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-sm">
                      <Badge tone={r.is_promotion_suggestion ? 'primary' : STATUS_TONE[r.status]}>
                        {r.is_promotion_suggestion ? 'suggestion' : r.status}
                      </Badge>
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
              {bandedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {bandedClasses.length === 0 && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Turn banding on for a Junior Secondary class first.</p>
            )}
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
              <option value="annual_promotion_banding">Annual Promotion Suggestion (3-term average)</option>
              <option value="reallocation">Mid-Year Reallocation (manual correction only)</option>
              <option value="initial_banding">Initial Banding (cold start, within this class)</option>
            </select>
            {computeForm.kind === 'annual_promotion_banding' && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Pick the 3rd-term exam. Earlier terms&apos; published results are included automatically. This rebuilds the
                arms pre-filled on the Promotion screen; it runs on its own when the 3rd-term result is published.
              </p>
            )}
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
