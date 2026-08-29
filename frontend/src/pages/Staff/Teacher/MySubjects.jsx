import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { subjects: '/academics/teaching/subjects' };

export default function TeacherMySubjects() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const subjects = data?.subjects || [];

  return (
    <AppShell portalId="teacher" pageTitle="My Subjects" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="My Subjects" subtitle="Subjects you teach this session, and which classes." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : subjects.length === 0 ? (
          <Card padding="lg"><EmptyState icon="auto_stories" text="You haven't been assigned to teach any subject yet." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((s) => (
              <Card key={s.id} padding="lg">
                <h3 className="font-headline-md text-headline-md text-on-surface">{s.name}</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Taught in {s.class_arms.length} class(es)</p>
                <div className="flex flex-wrap gap-xs mt-md">
                  {s.class_arms.map((a) => (
                    <span key={a.id} className="font-label-sm text-label-sm bg-primary/10 text-primary rounded-full px-sm py-0.5">{a.name}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
