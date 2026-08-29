import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/teaching/classes' };
const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const STATUSES = [
  { value: 'present', label: 'Present', tone: 'text-secondary' },
  { value: 'absent', label: 'Absent', tone: 'text-error' },
  { value: 'late', label: 'Late', tone: 'text-tertiary' },
  { value: 'excused', label: 'Excused', tone: 'text-outline' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const classes = data?.classes || [];

  const [armId, setArmId] = useState(searchParams.get('class_arm') || '');
  const [date, setDate] = useState(todayISO());
  const attendanceEndpoint = `/academics/teaching/attendance?class_arm=${armId || NIL_UUID}&date=${date}`;
  const attendanceData = useDashboardData(useMemo(() => ({ roster: attendanceEndpoint }), [attendanceEndpoint]));
  const roster = attendanceData.data?.roster || [];

  const [statusByStudent, setStatusByStudent] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const next = {};
    for (const s of roster) next[s.id] = s.status;
    setStatusByStudent(next);
    setSaveMessage('');
  }, [roster]);

  const setStatus = (studentId, status) => setStatusByStudent((prev) => ({ ...prev, [studentId]: status }));

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const records = roster.map((s) => ({ student: s.id, status: statusByStudent[s.id] || 'present' }));
      const result = await api.post('/academics/teaching/attendance', { class_arm: armId, date, records });
      setSaveMessage(`Recorded for ${result.count} student(s).`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell portalId="teacher" pageTitle="Attendance" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Attendance" subtitle="Take or edit attendance for one of your classes." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {!loading && (
          <div className="flex items-center gap-sm flex-wrap">
            <select value={armId} onChange={(e) => setArmId(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mcss-field px-md w-auto" />
          </div>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : !armId ? (
          <Card padding="lg"><EmptyState icon="fact_check" text="Select a class to mark attendance." /></Card>
        ) : roster.length === 0 ? (
          <Card padding="lg"><EmptyState icon="fact_check" text="No students in this class yet." /></Card>
        ) : (
          <div>
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{saveError}</p>}
            {saveMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{saveMessage}</p>}
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
                    {roster.map((s) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <div className="flex justify-end mt-md">
              <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
