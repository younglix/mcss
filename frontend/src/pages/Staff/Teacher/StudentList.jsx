import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { classes: '/academics/teaching/classes' };
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export default function TeacherStudentList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const classes = data?.classes || [];

  const [armId, setArmId] = useState(searchParams.get('class_arm') || '');
  const studentsEndpoint = `/academics/teaching/students?class_arm=${armId || NIL_UUID}`;
  const studentsData = useDashboardData(useMemo(() => ({ students: studentsEndpoint }), [studentsEndpoint]));
  const students = studentsData.data?.students || [];

  return (
    <AppShell portalId="teacher" pageTitle="Student List" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Student List" subtitle="Roster of a class you teach." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {!loading && (
          <select value={armId} onChange={(e) => setArmId(e.target.value)} className="mcss-field px-md w-auto">
            <option value="">Select a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
          </select>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : !armId ? (
          <Card padding="lg"><EmptyState icon="groups" text="Select a class to see its students." /></Card>
        ) : students.length === 0 ? (
          <Card padding="lg"><EmptyState icon="groups" text="No students in this class yet." /></Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-125 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student ID</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Full Name</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Gender</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Guardian Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-lg py-3 font-label-md text-label-md text-secondary">{s.identifier || '—'}</td>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{s.full_name}</td>
                      <td className="px-lg py-3 font-body-sm text-body-sm text-on-surface-variant capitalize">{s.gender || '—'}</td>
                      <td className="px-lg py-3 font-body-sm text-body-sm text-on-surface-variant">{s.guardian_phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
