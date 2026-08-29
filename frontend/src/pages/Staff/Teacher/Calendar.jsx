import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { events: '/calendar/events/mine?audience=staff' };

export default function TeacherCalendar() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const events = [...(data?.events || [])].sort((a, b) => a.start_at.localeCompare(b.start_at));

  return (
    <AppShell portalId="teacher" pageTitle="Calendar" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="School Calendar" subtitle="Upcoming school events and dates." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : events.length === 0 ? (
          <Card padding="lg"><EmptyState icon="event" text="No upcoming events." /></Card>
        ) : (
          <div className="space-y-md">
            {events.map((e) => (
              <Card key={e.id} padding="lg" className="flex items-start justify-between gap-md flex-wrap">
                <div>
                  <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{e.title}</h3>
                  {e.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{e.description}</p>}
                  {e.location && <p className="font-label-sm text-label-sm text-outline mt-1">📍 {e.location}</p>}
                </div>
                <Badge tone="secondary">
                  {e.all_day ? new Date(e.start_at).toLocaleDateString() : new Date(e.start_at).toLocaleString()}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
