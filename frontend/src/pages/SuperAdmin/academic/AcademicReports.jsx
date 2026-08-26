import Card from '../../../components/ui/Card.jsx';
import StatCard from '../../../components/ui/StatCard.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { reports: '/academics/reports' };

export default function SuperAdminAcademicReports() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const report = data?.reports;

  return (
    <DashboardPageShell
      pageTitle="Academic Reports"
      title="Academic Reports"
      subtitle={report?.session ? `${report.session}${report.term ? ` — ${report.term} Term` : ''}` : 'Drill-down academic statistics.'}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {report && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <StatCard icon="school" label="Active Students" value={report.total_students} />
            <StatCard icon="fact_check" label="Attendance Rate" value={report.attendance_rate !== null ? `${report.attendance_rate}%` : '—'} />
            <StatCard icon="quiz" label="Most Recent Exam" value={report.recent_exam?.name || '—'} />
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Headcount by Class</h3>
            {report.headcount_by_class.length === 0 || report.headcount_by_class.every((c) => c.count === 0) ? (
              <Card padding="lg">
                <EmptyState icon="school" text="No data available yet" />
              </Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-100 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {report.headcount_by_class.map((row) => (
                        <tr key={row.class}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.class}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">
              Average Scores by Subject {report.recent_exam ? `— ${report.recent_exam.name}` : ''}
            </h3>
            {report.average_scores_by_subject.length === 0 ? (
              <Card padding="lg">
                <EmptyState icon="grading" text="No data available yet" />
              </Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-100 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Subject</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Average</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Entries</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {report.average_scores_by_subject.map((row) => (
                        <tr key={row.subject}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.subject}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.average}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.entries}</td>
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
