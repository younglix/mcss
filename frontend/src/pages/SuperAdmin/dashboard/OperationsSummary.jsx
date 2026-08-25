import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { metricHelper, metricValue } from './dashboardHelpers.jsx';

const ENDPOINTS = { operations: '/dashboard/operations' };

export default function SuperAdminOperationsSummary() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell
      pageTitle="Operations Summary"
      title="Operations Summary"
      subtitle="Inventory, library, hostel, and transport status — live from the database."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={4}
    >
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
          <StatCard icon="inventory_2" iconTone="primary" label="Inventory Alerts" value={metricValue(data.operations.inventory_alerts)} helperText={metricHelper(data.operations.inventory_alerts)} />
          <StatCard icon="menu_book" iconTone="secondary" label="Library Activity" value={metricValue(data.operations.library_activity)} helperText={metricHelper(data.operations.library_activity)} />
          <StatCard icon="holiday_village" iconTone="tertiary" label="Hostel Occupancy" value={metricValue(data.operations.hostel_occupancy)} helperText={metricHelper(data.operations.hostel_occupancy)} />
          <StatCard icon="directions_bus" iconTone="primary" label="Transport Status" value={metricValue(data.operations.transport_status)} helperText={metricHelper(data.operations.transport_status)} />
        </div>
      )}
    </DashboardPageShell>
  );
}
