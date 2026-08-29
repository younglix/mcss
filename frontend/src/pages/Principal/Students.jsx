import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const STATUS_TONE = { active: 'success', graduated: 'primary', withdrawn: 'secondary', suspended: 'error' };

export default function PrincipalStudents() {
  const endpoints = useMemo(() => ({ students: '/academics/students', classes: '/academics/classes' }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const students = data?.students || [];
  const classes = data?.classes || [];

  const [armFilter, setArmFilter] = useState('');
  const filtered = armFilter ? students.filter((s) => s.class_arm === armFilter) : students;

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Students"
      title="Students"
      subtitle="Student overview across every class — enrollment and management stays with Administration."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          <div className="flex items-center gap-sm mb-md">
            <select value={armFilter} onChange={(e) => setArmFilter(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
            </select>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{filtered.length} student(s)</span>
          </div>

          <Card padding={filtered.length ? 'none' : 'lg'}>
            {filtered.length === 0 ? (
              <EmptyState icon="school" text="No students match this filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Admission No.</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Guardian</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {filtered.map((student) => (
                      <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{student.full_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{student.identifier || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{student.class_arm_label || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{student.guardian_name || '—'}</td>
                        <td className="px-lg py-4"><Badge tone={STATUS_TONE[student.status] || 'secondary'}>{student.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardPageShell>
  );
}
