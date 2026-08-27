import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { slots: '/academics/timetable/mine' };
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABEL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };

export default function StudentTimetable() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const slots = data?.slots || [];

  const byDay = DAY_ORDER.map((day) => ({
    day,
    entries: slots.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));

  return (
    <AppShell portalId="student" pageTitle="Timetable" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Class Timetable" subtitle="Your class's weekly schedule for the current session." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : slots.length === 0 ? (
          <Card padding="lg"><EmptyState icon="calendar_today" text="No timetable has been set for your class yet." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
            {byDay.map(({ day, entries }) => (
              <Card key={day} padding="lg">
                <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">{DAY_LABEL[day]}</h3>
                {entries.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">No classes scheduled.</p>
                ) : (
                  <div className="space-y-sm">
                    {entries.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-md border-b border-outline/10 last:border-0 pb-sm last:pb-0">
                        <div>
                          <p className="font-body-md text-body-md font-semibold text-on-surface">{s.subject_name}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{s.teacher_name || 'Not yet assigned'}</p>
                        </div>
                        <p className="font-label-sm text-label-sm text-primary whitespace-nowrap">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
