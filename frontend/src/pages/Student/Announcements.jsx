import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { announcements: '/cms/announcements/active' };

export default function StudentAnnouncements() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const announcements = data?.announcements || [];

  return (
    <AppShell portalId="student" pageTitle="Announcements" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Announcements" subtitle="School-wide notices currently in effect." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : announcements.length === 0 ? (
          <Card padding="lg"><EmptyState icon="campaign" text="No announcements right now." /></Card>
        ) : (
          <div className="space-y-md">
            {announcements.map((a) => (
              <Card key={a.id} padding="lg">
                <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{a.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1 whitespace-pre-wrap">{a.body}</p>
                <p className="font-label-sm text-label-sm text-outline mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
