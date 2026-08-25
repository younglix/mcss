import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { metricHelper, metricValue } from './dashboardHelpers.jsx';

const ENDPOINTS = { summary: '/dashboard/summary' };

export default function SuperAdminOverview() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell
      pageTitle="Overview / Statistics"
      title="Overview / Statistics"
      subtitle="Live counts from the database — fills in automatically as records are created."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={5}
    >
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-lg">
          <StatCard icon="school" iconTone="primary" label="Students" value={metricValue(data.summary.students)} helperText={metricHelper(data.summary.students)} />
          <StatCard icon="cast_for_education" iconTone="secondary" label="Teachers" value={metricValue(data.summary.teachers)} helperText={metricHelper(data.summary.teachers)} />
          <StatCard icon="badge" iconTone="tertiary" label="Staff" value={metricValue(data.summary.staff)} helperText={metricHelper(data.summary.staff)} />
          <StatCard icon="family_restroom" iconTone="primary" label="Parents" value={metricValue(data.summary.parents)} helperText={metricHelper(data.summary.parents)} />
          <StatCard icon="class" iconTone="secondary" label="Classes" value={metricValue(data.summary.classes)} helperText={metricHelper(data.summary.classes)} />
        </div>
      )}
    </DashboardPageShell>
  );
}
