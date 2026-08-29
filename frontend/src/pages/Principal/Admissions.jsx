import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { applications: '/admissions/applications' };
const STATUS_TONE = { submitted: 'secondary', under_review: 'warning', accepted: 'success', rejected: 'error' };
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export default function PrincipalAdmissions() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const applications = data?.applications || [];

  const [statusFilter, setStatusFilter] = useState('');
  const filtered = statusFilter ? applications.filter((a) => a.status === statusFilter) : applications;

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const openApplication = (app) => {
    setSelected(app);
    setNotes(app.review_notes || '');
    setActionError('');
  };

  const handleReview = async (status) => {
    setBusy(true);
    setActionError('');
    try {
      await api.post(`/admissions/applications/${selected.id}/review`, { status, review_notes: notes });
      setSelected(null);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update this application.');
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    setActionError('');
    try {
      await api.post(`/admissions/applications/${selected.id}/accept`, {});
      setSelected(null);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not accept this application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Admissions"
      title="Admissions"
      subtitle="Review and approve secondary applications."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mcss-field px-md w-auto mb-md">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <Card padding={filtered.length ? 'none' : 'lg'}>
            {filtered.length === 0 ? (
              <EmptyState icon="how_to_reg" text="No applications match this filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Reference</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class Applying For</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {filtered.map((app) => (
                      <tr key={app.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{app.reference_number}</td>
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{app.full_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{app.class_applying_for_name || '—'}</td>
                        <td className="px-lg py-4"><Badge tone={STATUS_TONE[app.status] || 'secondary'}>{app.status}</Badge></td>
                        <td className="px-lg py-4 text-right">
                          <button type="button" onClick={() => openApplication(app)} className="font-label-sm text-label-sm text-primary hover:underline">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Application — ${selected.full_name}` : ''}>
        {selected && (
          <div className="space-y-lg">
            {actionError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{actionError}</p>}
            <div className="space-y-xs">
              <p className="font-label-sm text-label-sm text-on-surface-variant">Reference: {selected.reference_number}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Class applying for: {selected.class_applying_for_name || '—'}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Previous school: {selected.previous_school || '—'}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Guardian: {selected.guardian_name || '—'} · {selected.guardian_phone || selected.guardian_email || '—'}</p>
              <Badge tone={STATUS_TONE[selected.status] || 'secondary'}>{selected.status}</Badge>
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Review Notes</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mcss-field w-full px-md py-sm resize-none" />
            </div>
            {selected.status !== 'accepted' && (
              <div className="flex flex-wrap gap-sm pt-md border-t border-outline/10">
                {selected.status === 'submitted' && (
                  <Button variant="secondary" onClick={() => handleReview('under_review')} disabled={busy}>Mark Under Review</Button>
                )}
                <Button variant="secondary" onClick={() => handleReview('rejected')} disabled={busy}>Reject</Button>
                {selected.level === 'secondary' && (
                  <Button variant="primary" onClick={handleAccept} disabled={busy}>{busy ? 'Working…' : 'Accept & Enroll'}</Button>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </DashboardPageShell>
  );
}
