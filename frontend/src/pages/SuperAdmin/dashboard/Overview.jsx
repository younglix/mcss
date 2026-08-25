import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { EmptyState, formatRelativeTime, metricHelper, metricValue } from './dashboardHelpers.jsx';

const ENDPOINTS = {
  summary: '/dashboard/summary',
  recentActivity: '/dashboard/recent-activity?limit=8',
  notifications: '/notifications/?page_size=5',
};

export default function SuperAdminOverview() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const location = useLocation();

  // Recent Activities / Notifications stay as in-page sections on the
  // Overview page rather than becoming their own routes — the sidebar's
  // Dashboard children still deep-link to them via hash.
  useEffect(() => {
    if (!loading && location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash]);

  return (
    <DashboardPageShell
      pageTitle="Super Admin Dashboard"
      title="Platform Overview"
      subtitle="Live counts from the database — sections fill in automatically as records are created."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={5}
    >
      {data && (
        <>
          <section id="overview" className="scroll-mt-20">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Overview / Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-lg">
              <StatCard icon="school" iconTone="primary" label="Students" value={metricValue(data.summary.students)} helperText={metricHelper(data.summary.students)} />
              <StatCard icon="cast_for_education" iconTone="secondary" label="Teachers" value={metricValue(data.summary.teachers)} helperText={metricHelper(data.summary.teachers)} />
              <StatCard icon="badge" iconTone="tertiary" label="Staff" value={metricValue(data.summary.staff)} helperText={metricHelper(data.summary.staff)} />
              <StatCard icon="family_restroom" iconTone="primary" label="Parents" value={metricValue(data.summary.parents)} helperText={metricHelper(data.summary.parents)} />
              <StatCard icon="class" iconTone="secondary" label="Classes" value={metricValue(data.summary.classes)} helperText={metricHelper(data.summary.classes)} />
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-xl mt-lg sm:mt-xl">
            <section id="recent-activities" className="scroll-mt-20">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-lg text-headline-lg text-primary">Recent Activities</h2>
                <Link to="/super-admin/audit" className="font-label-md text-label-md text-primary hover:underline">
                  View Full Audit Log
                </Link>
              </div>
              <Card padding={data.recentActivity.length ? 'none' : 'lg'}>
                {data.recentActivity.length === 0 ? (
                  <EmptyState icon="history" text="No data available yet" />
                ) : (
                  <ul className="divide-y divide-outline/10">
                    {data.recentActivity.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-md px-lg py-md">
                        <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">history</span>
                        <div className="min-w-0">
                          <p className="font-body-md text-body-md text-on-surface">
                            <span className="font-bold">{entry.actor}</span>{' '}
                            <code className="font-label-sm text-label-sm bg-surface-container px-1.5 py-0.5 rounded">{entry.action}</code>
                            {entry.target_type && <span className="text-on-surface-variant"> — {entry.target_type}</span>}
                          </p>
                          <p className="font-label-sm text-label-sm text-outline mt-0.5">{formatRelativeTime(entry.created_at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section id="notifications" className="scroll-mt-20">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Notifications</h2>
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
            </section>
          </div>
        </>
      )}
    </DashboardPageShell>
  );
}
