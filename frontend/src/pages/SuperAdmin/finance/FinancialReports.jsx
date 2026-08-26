import Card from '../../../components/ui/Card.jsx';
import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { reports: '/finance/reports' };

export default function SuperAdminFinancialReports() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const report = data?.reports;

  return (
    <DashboardPageShell
      pageTitle="Financial Reports"
      title="Financial Reports"
      subtitle={report?.session || 'Income, expenses, and payroll at a glance.'}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {report && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <StatCard icon="payments" label="Fees Collected" value={report.total_collected} />
            <StatCard icon="request_quote" label="Outstanding" value={report.outstanding} />
            <StatCard icon="trending_down" label="Total Expenses" value={report.total_expenses} />
            <StatCard icon="account_balance_wallet" label="Net Position" value={report.net_position} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Collected by Category</h3>
              {report.collected_by_category.length === 0 ? (
                <Card padding="lg">
                  <EmptyState icon="payments" text="No data available yet" />
                </Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.collected_by_category.map((row) => (
                        <tr key={row.category}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.category}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Expenses by Category</h3>
              {report.expenses_by_category.length === 0 ? (
                <Card padding="lg">
                  <EmptyState icon="trending_down" text="No data available yet" />
                </Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.expenses_by_category.map((row) => (
                        <tr key={row.category}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.category}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Latest Payroll Run</h3>
            {!report.latest_payroll_run ? (
              <Card padding="lg">
                <EmptyState icon="work" text="No data available yet" />
              </Card>
            ) : (
              <Card padding="lg">
                <p className="font-body-md text-body-md text-on-surface">
                  {report.latest_payroll_run.month}/{report.latest_payroll_run.year} — {report.latest_payroll_run.status} — Total net pay: {report.latest_payroll_run.total_net_pay}
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
