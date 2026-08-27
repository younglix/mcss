import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { assignments: '/student-services/transport/assignments/mine' };

export default function StudentTransport() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const assignments = data?.assignments || [];

  return (
    <AppShell portalId="student" pageTitle="Transport" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Transport" subtitle="Your assigned bus route and pickup point." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : assignments.length === 0 ? (
          <Card padding="lg"><EmptyState icon="directions_bus" text="You have no transport assignment." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2">
            {assignments.map((a) => (
              <Card key={a.id} padding="lg">
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Route</p>
                <h2 className="font-headline-sm text-headline-sm text-primary">{a.route_name}</h2>
                <p className="font-body-md text-body-md text-on-surface mt-md">Pickup Point: {a.pickup_point || 'Not set'}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Assigned {a.assigned_at}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
