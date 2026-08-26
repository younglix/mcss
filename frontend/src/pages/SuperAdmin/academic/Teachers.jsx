import Card from '../../../components/ui/Card.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { teachers: '/academics/teachers' };

export default function SuperAdminTeachers() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const teachers = data?.teachers || [];

  return (
    <DashboardPageShell
      pageTitle="Teachers"
      title="Teachers"
      subtitle="Staff teaching load for the current session — manage staff accounts in Staff Management, and subject/class-teacher assignments from the Classes page."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <Card padding={teachers.length ? 'none' : 'lg'}>
          {teachers.length === 0 ? (
            <EmptyState icon="groups" text="No data available yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Email</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Subjects Taught</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class Teacher Of</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{teacher.full_name}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{teacher.email || '—'}</td>
                      <td className="px-lg py-4">
                        {teacher.subjects_taught.length === 0 ? (
                          <span className="font-label-sm text-label-sm text-outline">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-xs">
                            {teacher.subjects_taught.map((s, i) => (
                              <span key={i} className="font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                                {s.subject} ({s.class_arm})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">
                        {teacher.class_teacher_of.length === 0 ? '—' : teacher.class_teacher_of.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </DashboardPageShell>
  );
}
