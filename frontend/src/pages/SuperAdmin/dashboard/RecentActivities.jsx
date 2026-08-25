import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { EmptyState, formatRelativeTime } from './dashboardHelpers.jsx';

const ENDPOINTS = { recentActivity: '/dashboard/recent-activity?limit=20' };

export default function SuperAdminRecentActivities() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell
      pageTitle="Recent Activities"
      title="Recent Activities"
      subtitle="The latest sensitive actions recorded across the platform."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          <div className="flex justify-end mb-md">
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
        </div>
      )}
    </DashboardPageShell>
  );
}
