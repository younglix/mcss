import { Link } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { dashboard: '/academics/teaching/dashboard', announcements: '/cms/announcements/active' };
const DAY_LABEL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const dash = data?.dashboard;
  const announcements = (data?.announcements || []).slice(0, 3);

  return (
    <AppShell portalId="teacher" pageTitle="Dashboard" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Teacher'}`} subtitle="Your classes and workflow at a glance." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : (
          <>
            <div className="grid gap-lg sm:grid-cols-3">
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">My Classes</p>
                <p className="font-headline-lg text-headline-lg text-primary mt-1">{dash?.class_count ?? 0}</p>
              </Card>
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">Today&apos;s Periods</p>
                <p className="font-headline-lg text-headline-lg text-primary mt-1">{dash?.today_timetable?.length ?? 0}</p>
              </Card>
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">Attendance Pending Today</p>
                <p className="font-headline-lg text-headline-lg text-primary mt-1">{dash?.pending_attendance?.length ?? 0}</p>
              </Card>
            </div>

            <div className="grid gap-lg lg:grid-cols-2">
              <Card padding="lg">
                <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Today&apos;s Timetable</h3>
                {!dash?.today_timetable?.length ? (
                  <EmptyState icon="calendar_today" text="No periods scheduled for you today." />
                ) : (
                  <div className="space-y-sm">
                    {dash.today_timetable.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-md border-b border-outline/10 last:border-0 pb-sm last:pb-0">
                        <div>
                          <p className="font-body-md text-body-md font-semibold text-on-surface">{s.subject_name}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{s.class_arm_label}</p>
                        </div>
                        <p className="font-label-sm text-label-sm text-primary whitespace-nowrap">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card padding="lg">
                <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Pending Tasks</h3>
                <div className="space-y-md">
                  {dash?.pending_attendance?.length > 0 && (
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Attendance not yet taken today</p>
                      <div className="flex flex-wrap gap-xs">
                        {dash.pending_attendance.map((a) => (
                          <Link key={a.id} to="/staff/teacher/attendance">
                            <Badge tone="error" variant="ribbon">{a.name}</Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {dash?.upcoming_assignments?.length > 0 && (
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Upcoming assignment due dates</p>
                      <div className="space-y-xs">
                        {dash.upcoming_assignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between gap-md">
                            <span className="font-body-sm text-body-sm text-on-surface">{a.title} — {a.class_arm_label}</span>
                            <span className="font-label-sm text-label-sm text-primary whitespace-nowrap">Due {a.due_date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!dash?.pending_attendance?.length && !dash?.upcoming_assignments?.length && (
                    <EmptyState icon="task_alt" text="You're all caught up." />
                  )}
                </div>
              </Card>
            </div>

            <Card padding="lg">
              <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Announcements</h3>
              {announcements.length === 0 ? (
                <EmptyState icon="campaign" text="No announcements right now." />
              ) : (
                <div className="space-y-md">
                  {announcements.map((a) => (
                    <div key={a.id} className="border-b border-outline/10 last:border-0 pb-sm last:pb-0">
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{a.title}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
