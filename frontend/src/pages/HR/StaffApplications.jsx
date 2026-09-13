import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import FormField from '../../components/ui/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';
import { copyText } from '../../lib/clipboard.js';

const ENDPOINTS = { applications: '/staff-applications/' };

const STATUS_TONE = { submitted: 'secondary', under_review: 'warning', approved: 'success', rejected: 'error' };
const STATUS_LABEL = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' };

/** HR's activate/deactivate control over the public registration link
 * (Requirement 2/3) — a plain wrapper around its own narrowly-scoped
 * endpoint, not the generic settings route (which would also hand HR every
 * other system setting). Deactivating takes effect immediately: the same
 * link stops accepting new submissions, it isn't rotated/regenerated. */
function RegistrationToggle() {
  const [state, setState] = useState(null); // { is_open, registration_path } | null while loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/staff-applications/registration-toggle')
      .then(setState)
      .catch(() => setError('Could not load the current registration status.'));
  }, []);

  const toggle = async () => {
    setSaving(true);
    setError('');
    try {
      const next = await api.post('/staff-applications/registration-toggle', { is_open: !state.is_open });
      setState(next);
    } catch (err) {
      setError(err.message || 'Could not change the registration status.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${state.registration_path}`;
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setError('Could not copy the link — copy it from the address bar instead.');
    }
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between flex-wrap gap-md">
        <div>
          <h3 className="font-headline-md text-headline-sm text-on-surface">Staff Registration Link</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            While open, anyone with the link can submit a request to create their own staff account — nothing goes
            live until you or Super Admin approve it. Closing it stops new submissions immediately.
          </p>
          {error && <p className="font-label-sm text-label-sm text-error mt-xs">{error}</p>}
        </div>
        {!state ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">Loading…</span>
        ) : (
          <div className="flex items-center gap-sm shrink-0">
            <Button variant="secondary" iconLeft="content_copy" onClick={copyLink}>{copied ? 'Copied!' : 'Copy Registration Link'}</Button>
            <Button variant={state.is_open ? 'secondary' : 'primary'} onClick={toggle} disabled={saving}>
              {saving ? 'Working…' : state.is_open ? 'Deactivate' : 'Activate'}
            </Button>
            <Badge tone={state.is_open ? 'success' : 'secondary'}>{state.is_open ? 'Open' : 'Closed'}</Badge>
          </div>
        )}
      </div>
    </Card>
  );
}

function DetailDrawer({ application, onClose, reload }) {
  const [notes, setNotes] = useState(application?.review_notes || '');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleReview = async (status) => {
    setSaving(true);
    setActionError('');
    try {
      await api.post(`/staff-applications/${application.id}/review`, { status, review_notes: notes });
      onClose();
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not update this application.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    setActionError('');
    try {
      await api.post(`/staff-applications/${application.id}/approve`, {});
      onClose();
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not approve this application.');
    } finally {
      setSaving(false);
    }
  };

  if (!application) return null;
  const isNonAcademic = application.staff_type === 'non_academic';

  return (
    <Drawer open={!!application} onClose={onClose} title={application.full_name}>
      <div className="space-y-lg">
        <div className="flex items-center gap-sm flex-wrap">
          <Badge tone={STATUS_TONE[application.status]}>{STATUS_LABEL[application.status]}</Badge>
          <Badge tone="secondary">{application.staff_type_label}</Badge>
        </div>

        {application.created_user_identifier && (
          <div className="bg-secondary-container/30 border border-secondary/20 rounded-lg p-md space-y-xs">
            <p className="font-label-md text-label-md font-bold text-secondary">Provisioned</p>
            <p className="font-label-sm text-label-sm text-on-surface">Staff ID: <span className="font-bold">{application.created_user_identifier}</span></p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Login credentials were emailed to them.</p>
          </div>
        )}
        {application.status === 'approved' && isNonAcademic && (
          <div className="bg-secondary-container/30 border border-secondary/20 rounded-lg p-md">
            <p className="font-label-md text-label-md font-bold text-secondary">Added to Non-Academic Staff Pay</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Set their Pay Amount there when you're ready to run payroll.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-md">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Contact</p>
            <p className="font-label-md text-label-md">{application.email || '—'} · {application.phone || '—'}</p>
          </div>
          {!isNonAcademic && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Sex / Date of Birth</p>
              <p className="font-label-md text-label-md capitalize">{application.sex || '—'} · {application.date_of_birth || '—'}</p>
            </div>
          )}
          {isNonAcademic && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Role</p>
              <p className="font-label-md text-label-md">{application.non_academic_role_title || '—'}</p>
            </div>
          )}
        </div>

        {!isNonAcademic && application.field_values.length > 0 && (
          <div className="border-t border-outline/10 pt-md">
            <h4 className="font-label-md text-label-md font-bold text-primary mb-sm">Account Details</h4>
            <div className="grid grid-cols-2 gap-md">
              {application.field_values.map((f) => (
                <div key={f.id}>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{f.field_label}</p>
                  <p className="font-label-md text-label-md">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {application.staff_type === 'teacher' && (
          <div className="border-t border-outline/10 pt-md">
            <h4 className="font-label-md text-label-md font-bold text-primary mb-sm">Subjects &amp; Classes Claimed</h4>
            {application.subject_claims.length === 0 ? (
              <p className="font-label-sm text-label-sm text-outline">None listed.</p>
            ) : (
              <ul className="space-y-xs">
                {application.subject_claims.map((c) => (
                  <li key={c.id} className="font-label-sm text-label-sm">{c.subject_name} — {c.class_arm_name}</li>
                ))}
              </ul>
            )}
            {application.is_form_teacher && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
                Form teacher of <span className="font-bold">{application.form_teacher_class_arm_name}</span>
              </p>
            )}
          </div>
        )}

        <div className="border-t border-outline/10 pt-md">
          <FormField field={{ key: 'notes', id: 'review_notes', label: 'Review Notes', type: 'textarea' }} value={notes} onChange={setNotes} />
        </div>

        {actionError && <p className="font-label-md text-label-md text-error">{actionError}</p>}

        <div className="flex flex-wrap gap-sm pt-md border-t border-outline/10">
          {application.status === 'submitted' && (
            <Button variant="secondary" disabled={saving} onClick={() => handleReview('under_review')}>Mark Under Review</Button>
          )}
          {application.status !== 'approved' && application.status !== 'rejected' && (
            <Button variant="primary" disabled={saving} onClick={handleApprove}>Approve</Button>
          )}
          {application.status !== 'rejected' && application.status !== 'approved' && (
            <Button variant="ghost" disabled={saving} onClick={() => handleReview('rejected')}>Reject</Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default function HRStaffApplications() {
  const { user } = useAuth();
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const applications = data?.applications || [];
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => {
    const c = { submitted: 0, under_review: 0, approved: 0, rejected: 0 };
    for (const a of applications) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [applications]);

  return (
    <AppShell portalId="hr" pageTitle="Staff Applications" user={{ name: user?.full_name || 'HR' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Staff Application Queue"
          subtitle="Review self-service account requests submitted through the public staff registration link."
        />

        <RegistrationToggle />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <Card key={key} padding="lg">
              <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
              <p className="font-headline-lg text-headline-lg text-primary">{counts[key] || 0}</p>
            </Card>
          ))}
        </div>

        {loading ? (
          <Card padding="lg"><p className="font-label-sm text-label-sm text-on-surface-variant">Loading…</p></Card>
        ) : error ? (
          <Card padding="lg"><p className="font-label-sm text-label-sm text-error">{error}</p></Card>
        ) : applications.length === 0 ? (
          <Card padding="lg"><EmptyState icon="how_to_reg" text="No data available yet" /></Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff Type</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Contact</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {applications.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{a.full_name}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.staff_type_label}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.email || a.phone || '—'}</td>
                      <td className="px-lg py-4"><Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge></td>
                      <td className="px-lg py-4 text-right">
                        <button type="button" onClick={() => setSelected(a)} className="font-label-sm text-label-sm text-primary hover:underline">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <DetailDrawer application={selected} onClose={() => setSelected(null)} reload={reload} />
    </AppShell>
  );
}
