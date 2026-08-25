import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from './DashboardPageShell.jsx';
import { useDashboardData } from './useDashboardData.js';
import { metricHelper, metricValue } from './dashboardHelpers.jsx';

const ENDPOINTS = { academic: '/dashboard/academic' };

export default function SuperAdminAcademicSummary() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell
      pageTitle="Academic Summary"
      title="Academic Summary"
      subtitle="Attendance, exams, and results — live from the database."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={4}
    >
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
          <StatCard icon="how_to_reg" iconTone="success" label="Present Today" value={metricValue(data.academic.present_today)} helperText={metricHelper(data.academic.present_today)} />
          <StatCard icon="event_busy" iconTone="error" label="Absent Today" value={metricValue(data.academic.absent_today)} helperText={metricHelper(data.academic.absent_today)} />
          <StatCard icon="quiz" iconTone="secondary" label="Upcoming Exams" value={metricValue(data.academic.upcoming_exams)} helperText={metricHelper(data.academic.upcoming_exams)} />
          <StatCard icon="grading" iconTone="tertiary" label="Pending Results" value={metricValue(data.academic.pending_results)} helperText={metricHelper(data.academic.pending_results)} />
        </div>
      )}
    </DashboardPageShell>
  );
}
