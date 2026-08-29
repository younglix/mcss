import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { report: '/operations/hr/reports' };

export default function HRReports() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const report = data?.report;

  return (
    <DashboardPageShell
      portalId="hr"
      pageTitle="Staff Reports"
      title="Staff Reports"
      subtitle="Headcount, leave, recruitment pipeline, and contracts approaching expiry."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {report && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <StatCard icon="badge" label="Total Staff" value={report.total_staff} />
            <StatCard icon="event_busy" iconTone="secondary" label="Contracts Expiring (60d)" value={report.expiring_contracts.length} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Headcount by Role</h3>
              {report.headcount_by_role.length === 0 ? (
                <Card padding="lg"><EmptyState icon="badge" text="No data available yet" /></Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.headcount_by_role.map((row) => (
                        <tr key={row.role}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface capitalize">{row.role}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Approved Leave by Type</h3>
              {report.leave_by_type.length === 0 ? (
                <Card padding="lg"><EmptyState icon="event_busy" text="No data available yet" /></Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.leave_by_type.map((row) => (
                        <tr key={row.leave_type}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface capitalize">{row.leave_type}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Recruitment Pipeline</h3>
              {report.applications_by_status.length === 0 ? (
                <Card padding="lg"><EmptyState icon="person_search" text="No data available yet" /></Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.applications_by_status.map((row) => (
                        <tr key={row.status}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface capitalize">{row.status}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Contracts Expiring Soon</h3>
            {report.expiring_contracts.length === 0 ? (
              <Card padding="lg"><EmptyState icon="event_busy" text="Nothing expiring in the next 60 days." /></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {report.expiring_contracts.map((c, i) => (
                        <tr key={i}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{c.staff_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{c.contract_type.replace('_', ' ')}</td>
                          <td className="px-lg py-3"><Badge tone="warning">{c.end_date}</Badge></td>
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
