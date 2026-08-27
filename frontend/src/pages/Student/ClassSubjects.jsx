import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { class: '/academics/classes/mine' };

export default function StudentClassSubjects() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const classInfo = data?.class;

  return (
    <AppShell portalId="student" pageTitle="Class & Subjects" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Class & Subjects" subtitle="Your current class, form teacher, and every subject assigned to it this session." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : !classInfo ? (
          <Card padding="lg"><EmptyState icon="school" text="You haven't been assigned to a class yet." /></Card>
        ) : (
          <>
            <Card padding="lg">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Class</p>
                  <h2 className="font-headline-sm text-headline-sm text-primary">{classInfo.school_class_name} {classInfo.name}</h2>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Class Teacher</p>
                  <p className="font-body-md text-body-md text-on-surface">{classInfo.class_teacher?.name || 'Not yet assigned'}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Classmates</p>
                  <p className="font-body-md text-body-md text-on-surface">{classInfo.student_count}</p>
                </div>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-125 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Subject</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {classInfo.subject_assignments.length === 0 ? (
                      <tr><td colSpan={2} className="px-lg py-6"><EmptyState icon="menu_book" text="No subjects assigned yet." /></td></tr>
                    ) : classInfo.subject_assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{a.subject_name}</td>
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface-variant">{a.teacher_name || 'Not yet assigned'}</td>
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
