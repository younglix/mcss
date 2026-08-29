import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { dashboard: '/academics/principal/dashboard' };

export default function PrincipalDashboard() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const dash = data?.dashboard;

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Principal Dashboard"
      title="Principal Dashboard"
      subtitle={dash?.session ? `School-wide overview — ${dash.session}.` : 'School-wide overview.'}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={4}
    >
      {dash && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <StatCard icon="school" label="Total Students" value={dash.total_students} />
            <StatCard icon="badge" iconTone="secondary" label="Total Staff" value={dash.total_staff} />
            <StatCard icon="event_available" iconTone="secondary" label="Present Today" value={dash.present_today} />
            <StatCard icon="event_busy" iconTone="error" label="Absent Today" value={dash.absent_today} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            <StatCard icon="payments" label="Fees Collected" value={`₦${Number(dash.fees_collected).toLocaleString()}`} />
            <StatCard icon="assignment_late" iconTone="error" label="Fees Outstanding" value={`₦${Number(dash.fees_outstanding).toLocaleString()}`} />
            <StatCard icon="fact_check" iconTone="secondary" label="Pending Approvals" value={dash.pending_approvals} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Upcoming Exams</h3>
              <Link to="/principal/results" className="font-label-sm text-label-sm text-primary hover:underline">View All →</Link>
            </div>
            {dash.upcoming_exams.length === 0 ? (
              <Card padding="lg"><EmptyState icon="quiz" text="No upcoming exams scheduled." /></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Exam</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Start Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {dash.upcoming_exams.map((ex) => (
                        <tr key={ex.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{ex.name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{ex.exam_type}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{ex.start_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {dash.pending_approvals > 0 && (
            <Card padding="lg" className="flex items-center justify-between gap-md bg-tertiary-container/20 border border-tertiary/20">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-tertiary text-headline-lg-mobile">fact_check</span>
                <p className="font-body-md text-body-md text-on-surface">{dash.pending_approvals} result submission(s) waiting on your sign-off.</p>
              </div>
              <Link to="/principal/approvals" className="font-label-md text-label-md text-primary hover:underline whitespace-nowrap">Review Now →</Link>
            </Card>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
