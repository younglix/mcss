import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { children: '/academics/students/my-children' };
const STATUS_TONE = { pending: 'warning', active: 'success', graduated: 'secondary', withdrawn: 'error', suspended: 'error' };

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">{label}</p>
      <p className="font-body-sm text-body-sm text-on-surface">{value || '—'}</p>
    </div>
  );
}

export default function ParentChildren() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const children = data?.children || [];

  return (
    <AppShell portalId="parent" pageTitle="Children's Profiles" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Children's Profiles" subtitle="Every child linked to your account." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : children.length === 0 ? (
          <Card padding="lg"><EmptyState icon="family_restroom" text="No children linked to this account yet." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2">
            {children.map((c) => (
              <Card key={c.id} padding="lg">
                <div className="flex items-center gap-md mb-md">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary">{c.full_name}</h2>
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <Field label="Student ID" value={c.identifier} />
                  <Field label="Registration No." value={c.registration_number} />
                  <Field label="Class" value={c.class_arm_label} />
                  <Field label="Gender" value={c.gender} />
                  <Field label="Date of Birth" value={c.date_of_birth} />
                  <Field label="Admission Date" value={c.admission_date} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
