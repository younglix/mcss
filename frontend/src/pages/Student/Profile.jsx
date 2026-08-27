import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { identity: '/auth/me', profile: '/academics/students/mine' };

const STATUS_TONE = { pending: 'warning', active: 'success', graduated: 'secondary', withdrawn: 'error', suspended: 'error' };

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">{label}</p>
      <p className="font-body-md text-body-md text-on-surface">{value || '—'}</p>
    </div>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const identity = data?.identity?.user;
  const profile = data?.profile;

  return (
    <AppShell portalId="student" pageTitle="Profile" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="My Profile" subtitle="Your account and enrollment details. Contact the school office to correct anything here." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : (
          <>
            <Card padding="lg">
              <div className="flex items-center gap-lg mb-lg">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[32px]">person</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary">{identity?.full_name}</h2>
                  {profile && <Badge tone={STATUS_TONE[profile.status]}>{profile.status}</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
                <Field label="Student ID" value={identity?.identifier} />
                <Field label="Registration Number" value={profile?.registration_number} />
                <Field label="Email" value={identity?.email} />
                <Field label="Phone" value={identity?.phone} />
                <Field label="Class" value={profile?.class_arm_label} />
                <Field label="Gender" value={profile?.gender} />
                <Field label="Date of Birth" value={profile?.date_of_birth} />
                <Field label="Admission Date" value={profile?.admission_date} />
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Guardian Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
                <Field label="Guardian Name" value={profile?.guardian_name} />
                <Field label="Guardian Phone" value={profile?.guardian_phone} />
                <Field label="Guardian Email" value={profile?.guardian_email} />
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
