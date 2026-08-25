import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { metricHelper, metricValue } from './dashboardHelpers.jsx';

const ENDPOINTS = { financial: '/dashboard/financial' };

export default function SuperAdminFinancialSummary() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell
      pageTitle="Financial Summary"
      title="Financial Summary"
      subtitle="Fees, outstanding balances, and today's payments — live from the database."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={3}
    >
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <StatCard icon="payments" iconTone="success" label="Fees Collected" value={metricValue(data.financial.fees_collected)} helperText={metricHelper(data.financial.fees_collected)} />
          <StatCard icon="request_quote" iconTone="error" label="Outstanding Fees" value={metricValue(data.financial.outstanding_fees)} helperText={metricHelper(data.financial.outstanding_fees)} />
          <StatCard icon="point_of_sale" iconTone="primary" label="Today's Payments" value={metricValue(data.financial.todays_payments)} helperText={metricHelper(data.financial.todays_payments)} />
        </div>
      )}
    </DashboardPageShell>
  );
}
