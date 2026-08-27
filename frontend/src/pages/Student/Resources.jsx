import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { resources: '/student-services/resources/mine' };

export default function StudentResources() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const resources = data?.resources || [];

  return (
    <AppShell portalId="student" pageTitle="E-Learning / Resources" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="E-Learning / Resources" subtitle="Study materials shared with your class." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : resources.length === 0 ? (
          <Card padding="lg"><EmptyState icon="auto_stories" text="No resources have been shared with your class yet." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
            {resources.map((r) => (
              <Card key={r.id} padding="lg">
                {r.category && <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{r.category}</p>}
                <h3 className="font-body-lg text-body-lg font-semibold text-on-surface mt-1">{r.title}</h3>
                {r.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{r.description}</p>}
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{r.uploaded_by_name || 'Staff'} · {new Date(r.created_at).toLocaleDateString()}</p>
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs mt-md text-primary font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open Resource
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
