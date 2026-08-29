import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';

const ENDPOINTS = {
  academic: '/academics/reports',
  finance: '/finance/reports',
  hr: '/operations/hr/reports',
};

export default function PrincipalReports() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const academic = data?.academic;
  const finance = data?.finance;
  const hr = data?.hr;

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Reports"
      title="Reports"
      subtitle="A consolidated view across academics, finance, and staff — see each area's own Reports page for the full breakdown."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={3}
    >
      {data && (
        <div className="space-y-xl">
          <div>
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Academics</h3>
              <Link to="/principal/performance" className="font-label-sm text-label-sm text-primary hover:underline">Full Report →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <StatCard icon="school" label="Total Students" value={academic?.total_students ?? '—'} />
              <StatCard icon="event_available" label="Attendance Rate" value={academic?.attendance_rate !== null && academic?.attendance_rate !== undefined ? `${academic.attendance_rate}%` : '—'} />
              <StatCard icon="quiz" label="Most Recent Exam" value={academic?.recent_exam?.name || '—'} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Finance</h3>
              <Link to="/principal/fee-reports" className="font-label-sm text-label-sm text-primary hover:underline">Full Report →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <StatCard icon="payments" label="Fees Collected" value={finance ? `₦${Number(finance.total_collected).toLocaleString()}` : '—'} />
              <StatCard icon="assignment_late" iconTone="error" label="Outstanding" value={finance ? `₦${Number(finance.outstanding).toLocaleString()}` : '—'} />
              <StatCard icon="account_balance_wallet" iconTone="secondary" label="Net Position" value={finance ? `₦${Number(finance.net_position).toLocaleString()}` : '—'} />
            </div>
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Staff</h3>
            {!hr ? (
              <Card padding="lg"><p className="font-body-md text-body-md text-on-surface-variant">No data available yet</p></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <Card padding="lg">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-sm">Headcount by Role</p>
                  {hr.headcount_by_role.length === 0 ? (
                    <p className="font-body-sm text-body-sm text-on-surface-variant italic">No data available yet.</p>
                  ) : (
                    <div className="space-y-xs">
                      {hr.headcount_by_role.map((row, i) => (
                        <div key={`${row.user_roles__role__name || 'unassigned'}-${i}`} className="flex justify-between text-body-sm">
                          <span className="text-on-surface">{row.user_roles__role__name || 'Unassigned'}</span>
                          <span className="text-on-surface-variant">{row.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card padding="lg">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-sm">Contracts Expiring Soon</p>
                  <p className="font-headline-md text-headline-md text-error">{hr.expiring_contracts?.length ?? 0}</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
