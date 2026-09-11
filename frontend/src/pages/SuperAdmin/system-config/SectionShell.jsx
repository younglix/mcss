import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';

/**
 * Loading skeleton + error/retry banner for a settings section embedded
 * inside the single consolidated Settings page (see Settings.jsx) — the
 * same inner chrome DashboardPageShell provides, minus AppShell/PageHeader,
 * since the page around every section already supplies those once.
 */
export default function SectionShell({ loading, error, onReload, skeletonCount = 1, children }) {
  return (
    <div className="space-y-lg">
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
  );
}
