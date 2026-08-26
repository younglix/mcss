import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/classes', sessions: '/config/sessions' };
const STATUSES = [
  { value: 'present', label: 'Present', tone: 'text-secondary' },
  { value: 'absent', label: 'Absent', tone: 'text-error' },
  { value: 'late', label: 'Late', tone: 'text-tertiary' },
  { value: 'excused', label: 'Excused', tone: 'text-outline' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SuperAdminAttendance() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const arms = data?.classes || [];
  const currentSession = (data?.sessions || []).find((s) => s.is_current);
  const currentTerm = currentSession?.terms?.find((t) => t.is_current);

  const [selectedArm, setSelectedArm] = useState('');
  const [date, setDate] = useState(todayISO());
  const studentsEndpoint = `/academics/students?class_arm=${selectedArm || '00000000-0000-0000-0000-000000000000'}`;
  const studentsData = useDashboardData(useMemo(() => ({ students: studentsEndpoint }), [studentsEndpoint]));
  const students = studentsData.data?.students || [];

  const [statusByStudent, setStatusByStudent] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const setStatus = (studentId, status) => setStatusByStudent((prev) => ({ ...prev, [studentId]: status }));

  const handleSubmit = async () => {
    if (!currentTerm) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const records = students.map((s) => ({ student: s.id, status: statusByStudent[s.id] || 'present' }));
      const result = await api.post('/academics/attendance/bulk-mark', {
        class_arm: selectedArm, date, term: currentTerm.id, records,
      });
      setSaveMessage(`Recorded for ${result.count} student(s).`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Attendance" title="Attendance" subtitle="Mark daily attendance for a class." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex items-center gap-sm flex-wrap mb-md">
            <select id="class-picker" value={selectedArm} onChange={(e) => setSelectedArm(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a class…</option>
              {arms.map((arm) => (
                <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>
              ))}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mcss-field px-md w-auto" />
          </div>

          {!currentTerm && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">
              No current term is set — set one in Administration → Academic Session & Terms first.
            </p>
          )}

          {!selectedArm ? (
            <Card padding="lg">
              <EmptyState icon="fact_check" text="Select a class to mark attendance." />
            </Card>
          ) : students.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="fact_check" text="No data available yet" />
            </Card>
          ) : (
            <div>
              {saveMessage && (
                <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">
                  {saveMessage}
                </p>
              )}
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.full_name}</td>
                          <td className="px-lg py-3">
                            <div className="flex gap-xs flex-wrap">
                              {STATUSES.map((opt) => {
                                const active = (statusByStudent[s.id] || 'present') === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(s.id, opt.value)}
                                    className={`font-label-sm text-label-sm px-sm py-1 rounded-full border transition-colors ${
                                      active ? `bg-primary text-on-primary border-primary` : `border-outline/20 ${opt.tone}`
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="flex justify-end mt-md">
                <Button variant="primary" onClick={handleSubmit} disabled={saving || !currentTerm}>
                  {saving ? 'Saving…' : 'Save Attendance'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
