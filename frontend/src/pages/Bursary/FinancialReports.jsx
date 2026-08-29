import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { reports: '/finance/reports' };

export default function BursaryFinancialReports() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const report = data?.reports;

  return (
    <DashboardPageShell
      portalId="bursary"
      pageTitle="Financial Reports"
      title="Financial Reports"
      subtitle={report?.session || 'Collections, outstanding, income vs expense, at a glance.'}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {report && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <StatCard icon="payments" label="Fees Collected" value={report.total_collected} />
            <StatCard icon="assignment_late" iconTone="error" label="Outstanding" value={report.outstanding} />
            <StatCard icon="sell" label="Total Discounts" value={report.total_discounts} />
            <StatCard icon="account_balance_wallet" iconTone="secondary" label="Net Position" value={report.net_position} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            <StatCard icon="trending_up" iconTone="secondary" label="Total Income" value={report.total_income} helperText="Fees collected + other income" />
            <StatCard icon="volunteer_activism" label="Other Income" value={report.total_other_income} />
            <StatCard icon="trending_down" iconTone="error" label="Total Expenses" value={report.total_expenses} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
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
                <Card padding="lg"><EmptyState icon="trending_down" text="No data available yet" /></Card>
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

            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Other Income by Category</h3>
              {report.income_by_category.length === 0 ? (
                <Card padding="lg"><EmptyState icon="trending_up" text="No data available yet" /></Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.income_by_category.map((row) => (
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
        </div>
      )}
    </DashboardPageShell>
  );
}
