import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { EmptyState, formatRelativeTime } from './dashboardHelpers.jsx';

const ENDPOINTS = { notifications: '/notifications/?page_size=20' };

export default function SuperAdminNotifications() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell
      pageTitle="Notifications"
      title="Notifications"
      subtitle="Notifications addressed to your account."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <Card padding={data.notifications.length ? 'none' : 'lg'}>
          {data.notifications.length === 0 ? (
            <EmptyState icon="notifications" text="No data available yet" />
          ) : (
            <ul className="divide-y divide-outline/10">
              {data.notifications.map((notification) => (
                <li key={notification.id} className="flex items-start gap-md px-lg py-md">
                  <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">
                    {notification.is_read ? 'notifications' : 'notifications_active'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-sm">
                      <p className="font-body-md text-body-md font-bold text-on-surface">{notification.title}</p>
                      {!notification.is_read && <Badge tone="secondary">New</Badge>}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">{notification.body}</p>
                    <p className="font-label-sm text-label-sm text-outline mt-0.5">{formatRelativeTime(notification.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </DashboardPageShell>
  );
}
