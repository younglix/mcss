import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const STATUS_TONE = { present: 'success', absent: 'error', late: 'warning', excused: 'secondary' };

export default function ParentAttendance() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/academics/students/my-children')
      .then((data) => {
        setChildren(data);
        if (data.length > 0) setActiveChildId(data[0].id);
        else setLoading(false);
      })
      .catch((err) => { setError(err.message || 'Could not load children.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    api.get(`/academics/attendance/child/${activeChildId}`)
      .then(setRecords)
      .catch((err) => setError(err.message || 'Could not load attendance.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));
  const presentCount = records.filter((r) => r.status === 'present').length;
  const rate = records.length ? Math.round((presentCount / records.length) * 100) : null;

  return (
    <AppShell portalId="parent" pageTitle="Attendance" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Attendance"
          subtitle="Each child's daily attendance record."
          actions={children.length > 0 && (
            <ChildSwitcher children={childOptions} activeId={activeChildId} onSelect={setActiveChildId} onAdd={() => {}} />
          )}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {children.length === 0 && !loading ? (
          <Card padding="lg"><EmptyState icon="family_restroom" text="No children linked to this account yet." /></Card>
        ) : loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : records.length === 0 ? (
          <Card padding="lg"><EmptyState icon="event_available" text="No attendance has been recorded yet." /></Card>
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
