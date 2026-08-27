import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { records: '/academics/attendance/mine' };
const STATUS_TONE = { present: 'success', absent: 'error', late: 'warning', excused: 'secondary' };

export default function StudentAttendance() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const records = data?.records || [];
  const presentCount = records.filter((r) => r.status === 'present').length;
  const rate = records.length ? Math.round((presentCount / records.length) * 100) : null;

  return (
    <AppShell portalId="student" pageTitle="Attendance" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Attendance" subtitle="Every day marked for you this session, and your overall attendance rate." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : records.length === 0 ? (
          <Card padding="lg"><EmptyState icon="event_available" text="No attendance has been recorded for you yet." /></Card>
        ) : (
          <>
            <Card padding="lg" className="flex items-center gap-xl flex-wrap">
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Attendance Rate</p>
                <p className="font-headline-md text-headline-md text-primary">{rate}%</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Days Present</p>
                <p className="font-body-lg text-body-lg text-on-surface">{presentCount} / {records.length}</p>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-125 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Date</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{r.date}</td>
                        <td className="px-lg py-4"><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
