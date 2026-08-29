import { useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABEL = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' };

export default function PrincipalAcademics() {
  const endpoints = useMemo(() => ({
    classes: '/academics/classes', subjects: '/academics/subjects', timetable: '/academics/timetable',
  }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const classes = data?.classes || [];
  const subjects = data?.subjects || [];
  const timetable = data?.timetable || [];

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Academics"
      title="Academics"
      subtitle="Classes, subjects, and the current timetable, school-wide."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {data && (
        <div className="space-y-xl">
          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Classes</h3>
            {classes.length === 0 ? (
              <Card padding="lg"><EmptyState icon="school" text="No classes set up yet." /></Card>
            ) : (
              <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
                {classes.map((c) => (
                  <Card key={c.id} padding="lg">
                    <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{c.school_class_name}</p>
                    <h4 className="font-headline-md text-headline-md text-on-surface">{c.name}</h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{c.student_count} student(s)</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{c.class_teacher ? `Class Teacher: ${c.class_teacher.name}` : 'No class teacher assigned'}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{c.subject_assignments.length} subject(s) assigned</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Subjects</h3>
            {subjects.length === 0 ? (
              <Card padding="lg"><EmptyState icon="menu_book" text="No subjects set up yet." /></Card>
            ) : (
              <div className="flex flex-wrap gap-xs">
                {subjects.map((s) => (
                  <span key={s.id} className="font-label-sm text-label-sm bg-primary/10 text-primary rounded-full px-md py-1">{s.name}{s.is_core && ' · Core'}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Timetable Overview</h3>
            {timetable.length === 0 ? (
              <Card padding="lg"><EmptyState icon="calendar_today" text="No timetable slots set up yet." /></Card>
            ) : (
              <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-5">
                {DAY_ORDER.map((day) => {
                  const entries = timetable.filter((t) => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
                  return (
                    <Card key={day} padding="lg">
                      <h4 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">{DAY_LABEL[day]}</h4>
                      {entries.length === 0 ? (
                        <p className="font-body-sm text-body-sm text-on-surface-variant italic">No slots.</p>
                      ) : (
                        <div className="space-y-sm">
                          {entries.slice(0, 8).map((t) => (
                            <div key={t.id} className="text-body-sm">
                              <p className="font-body-sm text-body-sm text-on-surface">{t.subject_name} — {t.class_arm_label}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">{t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)} · {t.teacher_name || 'Unassigned'}</p>
                            </div>
                          ))}
                          {entries.length > 8 && <p className="font-label-sm text-label-sm text-outline">+{entries.length - 8} more</p>}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
