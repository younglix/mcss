import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { report: '/academics/reports' };

export default function PrincipalPerformance() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const report = data?.report;

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Academic Performance"
      title="Academic Performance"
      subtitle={report?.session ? `Reports and analytics — ${report.session}.` : 'Reports and analytics.'}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {report && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            <StatCard icon="school" label="Total Students" value={report.total_students} />
            <StatCard icon="event_available" label="Attendance Rate" value={report.attendance_rate !== null ? `${report.attendance_rate}%` : '—'} />
            <StatCard icon="quiz" label="Most Recent Exam" value={report.recent_exam?.name || '—'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Headcount by Class</h3>
              {report.headcount_by_class.length === 0 ? (
                <Card padding="lg"><EmptyState icon="school" text="No data available yet" /></Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.headcount_by_class.map((row) => (
                        <tr key={row.class}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.class}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Average Score by Subject {report.recent_exam ? `(${report.recent_exam.name})` : ''}</h3>
              {report.average_scores_by_subject.length === 0 ? (
                <Card padding="lg"><EmptyState icon="insights" text="No data available yet" /></Card>
              ) : (
                <Card padding="none">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-outline/10">
                      {report.average_scores_by_subject.map((row) => (
                        <tr key={row.subject}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.subject}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface text-right">{row.average}% ({row.entries} entries)</td>
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
