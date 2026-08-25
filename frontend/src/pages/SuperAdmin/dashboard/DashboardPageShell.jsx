import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

/**
 * Shared chrome for every Dashboard sub-page (Overview, Financial Summary,
 * Academic Summary, Operations Summary): AppShell + PageHeader + Refresh
 * button + loading skeleton + error/retry banner. Each page just supplies
 * its own title/subtitle/data-fetch state and renders its own content once
 * loaded.
 */
export default function DashboardPageShell({ pageTitle, title, subtitle, loading, error, onReload, skeletonCount = 4, children }) {
  const { user } = useAuth();

  return (
    <AppShell portalId="superAdmin" pageTitle={pageTitle} user={{ name: user?.full_name || 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={
            <Button variant="secondary" iconLeft="refresh" onClick={onReload} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          }
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10 flex items-center justify-between gap-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="font-body-md text-body-md text-on-surface">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={onReload}>
              Retry
            </Button>
          </Card>
        )}

        {loading && !children ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Card key={i} padding="lg" className="h-32 animate-pulse bg-surface-container-low" />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </AppShell>
  );
}
