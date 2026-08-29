import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const STATUS_TONE = { present: 'success', absent: 'error', late: 'warning', excused: 'secondary' };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PrincipalAttendance() {
  const endpoints = useMemo(() => ({ classes: '/academics/classes' }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const arms = data?.classes || [];

  const [armId, setArmId] = useState('');
  const [date, setDate] = useState(todayISO());
  const recordsEndpoint = `/academics/attendance?class_arm=${armId || NIL_UUID}&date=${date}`;
  const recordsData = useDashboardData(useMemo(() => ({ records: recordsEndpoint }), [recordsEndpoint]));
  const records = recordsData.data?.records || [];

  const summary = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Attendance"
      title="Attendance"
      subtitle="School-wide attendance — read-only; taking attendance stays with class teachers."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          <div className="flex items-center gap-sm flex-wrap mb-md">
            <select value={armId} onChange={(e) => setArmId(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a class…</option>
              {arms.map((arm) => <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>)}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mcss-field px-md w-auto" />
          </div>

          {!armId ? (
            <Card padding="lg"><EmptyState icon="event_available" text="Select a class and date to view attendance." /></Card>
          ) : records.length === 0 ? (
            <Card padding="lg"><EmptyState icon="event_available" text="No attendance recorded for this class on this date." /></Card>
          ) : (
            <div>
              <div className="flex gap-md flex-wrap mb-md">
                {Object.entries(summary).map(([status, count]) => (
                  <Badge key={status} tone={STATUS_TONE[status] || 'secondary'}>{count} {status}</Badge>
                ))}
              </div>
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {records.map((r) => (
                        <tr key={r.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{r.student_name}</td>
                          <td className="px-lg py-3"><Badge tone={STATUS_TONE[r.status] || 'secondary'}>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
