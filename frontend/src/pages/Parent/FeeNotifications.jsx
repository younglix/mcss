import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { notifications: '/notifications/?category=payment&page_size=50' };

export default function ParentFeeNotifications() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const notifications = data?.notifications || [];

  return (
    <AppShell portalId="parent" pageTitle="Fee Notifications" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Fee Notifications" subtitle="Every invoice and payment notice for your children." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : notifications.length === 0 ? (
          <Card padding="lg"><EmptyState icon="notifications" text="No fee notifications yet." /></Card>
        ) : (
          <div className="space-y-sm">
            {notifications.map((n) => (
              <Card key={n.id} padding="lg" className={n.is_read ? '' : 'border-l-4 border-primary'}>
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface">{n.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{n.body}</p>
                  </div>
                  <p className="font-label-sm text-label-sm text-outline whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
