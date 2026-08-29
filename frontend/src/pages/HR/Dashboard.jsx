import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { dashboard: '/operations/hr/dashboard' };

export default function HRDashboard() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const dash = data?.dashboard;

  return (
    <DashboardPageShell
      portalId="hr"
      pageTitle="HR Dashboard"
      title="HR Dashboard"
      subtitle="Staff lifecycle and payroll, at a glance."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={4}
    >
      {dash && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <StatCard icon="badge" label="Total Staff" value={dash.total_staff} />
            <StatCard icon="event_busy" iconTone="secondary" label="On Leave Today" value={dash.on_leave_today} />
            <StatCard icon="person_add" iconTone="secondary" label="New Hires (30d)" value={dash.new_hires_30d} />
            <StatCard icon="pending_actions" iconTone="error" label="Pending Leave Requests" value={dash.pending_leave_requests} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <StatCard icon="person_search" label="Applications in Pipeline" value={dash.pending_applications} />
            <StatCard icon="description" iconTone="error" label="Contracts Expiring (30d)" value={dash.contracts_expiring_soon} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Pending Leave Requests</h3>
              <Link to="/hr/leave" className="font-label-sm text-label-sm text-primary hover:underline">View All →</Link>
            </div>
            {dash.recent_pending_leave.length === 0 ? (
              <Card padding="lg"><EmptyState icon="task_alt" text="Nothing waiting on approval." /></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Dates</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {dash.recent_pending_leave.map((l) => (
                        <tr key={l.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{l.staff_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{l.leave_type}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{l.start_date} – {l.end_date}</td>
                          <td className="px-lg py-3"><Badge tone="secondary">{l.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
