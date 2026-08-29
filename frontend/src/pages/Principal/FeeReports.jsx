import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { report: '/finance/reports' };

export default function PrincipalFeeReports() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const report = data?.report;

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Fee Reports"
      title="Fee Reports"
      subtitle={report?.session ? `Fees collected, outstanding, and financial summaries — ${report.session}.` : 'Fees collected, outstanding, and financial summaries.'}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {report && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <StatCard icon="payments" label="Fees Collected" value={`₦${Number(report.total_collected).toLocaleString()}`} />
            <StatCard icon="assignment_late" iconTone="error" label="Outstanding" value={`₦${Number(report.outstanding).toLocaleString()}`} />
            <StatCard icon="sell" label="Total Discounts" value={`₦${Number(report.total_discounts).toLocaleString()}`} />
            <StatCard icon="account_balance_wallet" iconTone="secondary" label="Net Position" value={`₦${Number(report.net_position).toLocaleString()}`} />
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Collected by Category</h3>
            {report.collected_by_category.length === 0 ? (
              <Card padding="lg"><EmptyState icon="payments" text="No data available yet" /></Card>
            ) : (
              <Card padding="none">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-outline/10">
                    {report.collected_by_category.map((row) => (
                      <tr key={row.category}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.category}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">₦{Number(row.total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
