import { useMemo, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import FormField from '../../components/ui/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from './dashboard/useDashboardData.js';
import { EmptyState } from './dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = { applications: '/admissions/applications' };

const STATUS_TONE = { submitted: 'secondary', under_review: 'warning', accepted: 'success', rejected: 'error' };
const STATUS_LABEL = { submitted: 'Submitted', under_review: 'Under Review', accepted: 'Accepted', rejected: 'Rejected' };

function DetailDrawer({ application, onClose, reload }) {
  const [notes, setNotes] = useState(application?.review_notes || '');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleReview = async (status) => {
    setSaving(true);
    setActionError('');
    try {
      await api.post(`/admissions/applications/${application.id}/review`, { status, review_notes: notes });
      onClose();
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not update this application.');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    setSaving(true);
    setActionError('');
    try {
      await api.post(`/admissions/applications/${application.id}/accept`, {});
      onClose();
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not accept this application.');
    } finally {
      setSaving(false);
    }
  };

  if (!application) return null;
  const isSecondary = application.level === 'secondary';

  return (
    <Drawer open={!!application} onClose={onClose} title={application.full_name}>
      <div className="space-y-lg">
        <div className="flex items-center gap-sm flex-wrap">
          <Badge tone={STATUS_TONE[application.status]}>{STATUS_LABEL[application.status]}</Badge>
          <Badge tone="secondary">{isSecondary ? 'Secondary' : 'Primary'}</Badge>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{application.reference_number}</span>
        </div>

        {application.student_identifier && (
          <div className="bg-secondary-container/30 border border-secondary/20 rounded-lg p-md space-y-xs">
            <p className="font-label-md text-label-md font-bold text-secondary">Provisioned</p>
            <p className="font-label-sm text-label-sm text-on-surface">Student ID: <span className="font-bold">{application.student_identifier || '—'}</span></p>
            <p className="font-label-sm text-label-sm text-on-surface">Registration No.: <span className="font-bold">{application.registration_number || 'Pending fee payment'}</span></p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-md">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Date of Birth</p>
            <p className="font-label-md text-label-md">{application.date_of_birth || '—'}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Gender</p>
            <p className="font-label-md text-label-md capitalize">{application.gender || '—'}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Applying For</p>
            <p className="font-label-md text-label-md">{application.class_applying_for_name || '—'}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Present Class</p>
            <p className="font-label-md text-label-md">{application.present_class || '—'}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Religion</p>
            <p className="font-label-md text-label-md capitalize">{application.religion === 'others' ? application.religion_other : application.religion || '—'}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Nationality / State</p>
            <p className="font-label-md text-label-md">{application.nationality || '—'} / {application.state_of_origin || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Contact</p>
            <p className="font-label-md text-label-md">{application.email || '—'} · {application.phone || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Address</p>
            <p className="font-label-md text-label-md">{application.address || '—'}</p>
          </div>
        </div>

        {application.has_guardian && (
          <div className="border-t border-outline/10 pt-md">
            <h4 className="font-label-md text-label-md font-bold text-primary mb-sm">Guardian</h4>
            <p className="font-label-md text-label-md">{application.guardian_name || '—'}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{application.guardian_phone || '—'} · {application.guardian_email || '—'}</p>
          </div>
        )}

        <div className="border-t border-outline/10 pt-md grid grid-cols-2 gap-md">
          <div>
            <h4 className="font-label-md text-label-md font-bold text-primary mb-sm">Father</h4>
            <p className="font-label-sm text-label-sm">{application.father_name || '—'}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{application.father_phone || '—'}</p>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-primary mb-sm">Mother</h4>
            <p className="font-label-sm text-label-sm">{application.mother_name || '—'}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{application.mother_phone || '—'}</p>
          </div>
        </div>

        <div className="border-t border-outline/10 pt-md">
          <h4 className="font-label-md text-label-md font-bold text-primary mb-sm">Documents</h4>
          {application.documents.length === 0 ? (
            <p className="font-label-sm text-label-sm text-outline">None attached yet.</p>
          ) : (
            <ul className="space-y-xs">
              {application.documents.map((d) => (
                <li key={d.id}>
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="font-label-sm text-label-sm text-primary hover:underline">{d.title}</a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-outline/10 pt-md">
          <FormField field={{ key: 'notes', id: 'review_notes', label: 'Review Notes', type: 'textarea' }} value={notes} onChange={setNotes} />
        </div>

        {actionError && <p className="font-label-md text-label-md text-error">{actionError}</p>}

        {!isSecondary ? (
          <div className="bg-surface-container p-md rounded-lg">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Primary applications are view-only for now — there is no downstream enrollment workflow for this level yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-sm pt-md border-t border-outline/10">
            {application.status !== 'under_review' && application.status === 'submitted' && (
              <Button variant="secondary" disabled={saving} onClick={() => handleReview('under_review')}>Mark Under Review</Button>
            )}
            {application.status !== 'accepted' && application.status !== 'rejected' && (
              <Button variant="primary" disabled={saving} onClick={handleAccept}>Accept</Button>
            )}
            {application.status !== 'rejected' && application.status !== 'accepted' && (
              <Button variant="ghost" disabled={saving} onClick={() => handleReview('rejected')}>Reject</Button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function SuperAdminApplicantApprovals() {
  const { user } = useAuth();
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const applications = data?.applications || [];
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => {
    const c = { submitted: 0, under_review: 0, accepted: 0, rejected: 0 };
    for (const a of applications) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [applications]);

  return (
    <AppShell portalId="superAdmin" pageTitle="Applicant Approvals" user={{ name: user?.full_name || 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Applicant Approval Queue" subtitle="Review and manage admission applications submitted through the public apply form." />

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
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Applicant</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Reference</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Level</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Applying For</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {applications.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{a.full_name}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.reference_number}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{a.level}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.class_applying_for_name || '—'}</td>
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
