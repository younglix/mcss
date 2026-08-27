import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { assignments: '/academics/assignments/mine' };

export default function StudentAssignments() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const assignments = [...(data?.assignments || [])].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell portalId="student" pageTitle="Assignments" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Assignments" subtitle="What's due for your class, across every subject." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : assignments.length === 0 ? (
          <Card padding="lg"><EmptyState icon="assignment" text="No assignments have been given yet." /></Card>
        ) : (
          <div className="space-y-md">
            {assignments.map((a) => {
              const overdue = a.due_date < today;
              return (
                <Card key={a.id} padding="lg">
                  <div className="flex items-start justify-between gap-md flex-wrap">
                    <div>
                      <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{a.subject_name}</p>
                      <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{a.title}</h3>
                      {a.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{a.description}</p>}
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{a.teacher_name || 'Teacher not set'}</p>
                    </div>
                    <Badge tone={overdue ? 'error' : 'secondary'}>Due {a.due_date}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
