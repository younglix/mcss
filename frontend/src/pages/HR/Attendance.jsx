import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = { staff: '/users/?user_type=staff' };
const STATUSES = [
  { value: 'present', label: 'Present', tone: 'text-secondary' },
  { value: 'late', label: 'Late', tone: 'text-tertiary' },
  { value: 'absent', label: 'Absent', tone: 'text-error' },
  { value: 'on_leave', label: 'On Leave', tone: 'text-outline' },
];
const STATUS_TONE = { present: 'success', late: 'warning', absent: 'error', on_leave: 'secondary' };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HRAttendance() {
  const { data: staffData, loading: staffLoading, error: staffError } = useDashboardData(ENDPOINTS);
  const staff = staffData?.staff || [];

  const [date, setDate] = useState(todayISO());
  const attendanceEndpoint = `/operations/hr/attendance?date=${date}`;
  const { data, loading, error, reload } = useDashboardData(useMemo(() => ({ records: attendanceEndpoint }), [attendanceEndpoint]));
  const records = data?.records || [];
  const byStaffId = Object.fromEntries(records.map((r) => [r.staff, r]));

  const [saving, setSaving] = useState({});

  const setStatus = async (staffMember, status) => {
    setSaving((prev) => ({ ...prev, [staffMember.id]: true }));
    try {
      const existing = byStaffId[staffMember.id];
      if (existing) {
        await api.patch(`/operations/hr/attendance/${existing.id}`, { status });
      } else {
        await api.post('/operations/hr/attendance', { staff: staffMember.id, date, status });
      }
      reload();
    } finally {
      setSaving((prev) => ({ ...prev, [staffMember.id]: false }));
    }
  };

  return (
    <DashboardPageShell
      portalId="hr"
      pageTitle="Staff Attendance"
      title="Staff Attendance"
      subtitle="Daily clock-in/attendance status for every staff member."
      loading={staffLoading || loading}
      error={staffError || error}
      onReload={reload}
      skeletonCount={1}
    >
      {staffData && (
        <div>
          <div className="flex items-center gap-sm flex-wrap mb-md">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mcss-field px-md w-auto" />
          </div>

          {staff.length === 0 ? (
            <Card padding="lg"><EmptyState icon="fingerprint" text="No staff accounts yet." /></Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Current Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {staff.map((s) => {
                      const record = byStaffId[s.id];
                      return (
                        <tr key={s.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.full_name}</td>
                          <td className="px-lg py-3">
                            {record ? <Badge tone={STATUS_TONE[record.status]}>{record.status.replace('_', ' ')}</Badge> : <span className="font-label-sm text-label-sm text-outline">Not marked</span>}
                          </td>
                          <td className="px-lg py-3">
                            <div className="flex gap-xs flex-wrap">
                              {STATUSES.map((opt) => {
                                const active = record?.status === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={saving[s.id]}
                                    onClick={() => setStatus(s, opt.value)}
                                    className={`font-label-sm text-label-sm px-sm py-1 rounded-full border transition-colors disabled:opacity-50 ${
                                      active ? 'bg-primary text-on-primary border-primary' : `border-outline/20 ${opt.tone}`
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
