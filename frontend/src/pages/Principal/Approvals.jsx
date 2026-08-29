import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = {
  resultSubmissions: '/academics/result-submissions/pending',
  admissions: '/admissions/applications?status=submitted',
};

export default function PrincipalApprovals() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const resultSubmissions = data?.resultSubmissions || [];
  const admissions = data?.admissions || [];
  const [busyId, setBusyId] = useState(null);

  const handleReviewResult = async (submission, status) => {
    setBusyId(submission.id);
    try {
      await api.post(`/academics/result-submissions/${submission.id}/review`, { status });
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const handleAdmissionReview = async (application, status) => {
    setBusyId(application.id);
    try {
      await api.post(`/admissions/applications/${application.id}/review`, { status });
      reload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Approvals"
      title="Approvals"
      subtitle="Everything waiting on your sign-off — result submissions and admission applications."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {data && (
        <div className="space-y-xl">
          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Result Submissions</h3>
            {resultSubmissions.length === 0 ? (
              <Card padding="lg"><EmptyState icon="fact_check" text="Nothing waiting on approval." /></Card>
            ) : (
              <div className="space-y-sm">
                {resultSubmissions.map((sub) => (
                  <Card key={sub.id} padding="lg">
                    <div className="flex items-center justify-between gap-md flex-wrap">
                      <div>
                        <p className="font-body-md text-body-md font-semibold text-on-surface">{sub.exam_name} — {sub.subject_name} — {sub.class_arm_label}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Submitted by {sub.teacher_name || 'Unknown'} on {new Date(sub.submitted_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-sm">
                        <Button variant="secondary" size="sm" onClick={() => handleReviewResult(sub, 'rejected')} disabled={busyId === sub.id}>Reject</Button>
                        <Button variant="primary" size="sm" onClick={() => handleReviewResult(sub, 'approved')} disabled={busyId === sub.id}>Approve</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Admission Applications</h3>
              <Link to="/principal/admissions" className="font-label-sm text-label-sm text-primary hover:underline">Full Admissions →</Link>
            </div>
            {admissions.length === 0 ? (
              <Card padding="lg"><EmptyState icon="how_to_reg" text="Nothing waiting on review." /></Card>
            ) : (
              <div className="space-y-sm">
                {admissions.map((app) => (
                  <Card key={app.id} padding="lg">
                    <div className="flex items-center justify-between gap-md flex-wrap">
                      <div>
                        <p className="font-body-md text-body-md font-semibold text-on-surface">{app.full_name}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{app.reference_number} · Applying for {app.class_applying_for_name || '—'}</p>
                      </div>
                      <div className="flex items-center gap-sm">
                        <Badge tone="secondary">{app.status}</Badge>
                        <Button variant="secondary" size="sm" onClick={() => handleAdmissionReview(app, 'under_review')} disabled={busyId === app.id}>Mark Under Review</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
