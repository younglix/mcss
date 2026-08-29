import { Link } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { classes: '/academics/teaching/classes' };

export default function TeacherMyClasses() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const classes = data?.classes || [];

  return (
    <AppShell portalId="teacher" pageTitle="My Classes" user={{ name: user?.full_name || 'Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="My Classes" subtitle="Every class-arm you teach or class-teach this session." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : classes.length === 0 ? (
          <Card padding="lg"><EmptyState icon="school" text="You haven't been assigned to any class yet." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <Card key={c.id} padding="lg">
                <div className="flex items-start justify-between gap-sm">
                  <div>
                    <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{c.school_class_name}</p>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{c.name}</h3>
                  </div>
                  {c.is_class_teacher && <Badge tone="tertiary" variant="ribbon">Class Teacher</Badge>}
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{c.student_count} student(s)</p>
                <div className="flex flex-wrap gap-xs mt-md">
                  {c.subjects.map((s) => (
                    <span key={s.id} className="font-label-sm text-label-sm bg-primary/10 text-primary rounded-full px-sm py-0.5">{s.name}</span>
                  ))}
                </div>
                <div className="flex items-center gap-md mt-md pt-md border-t border-outline/10">
                  <Link to={`/staff/teacher/students?class_arm=${c.id}`} className="font-label-sm text-label-sm text-primary hover:underline">Student List</Link>
                  <Link to={`/staff/teacher/attendance?class_arm=${c.id}`} className="font-label-sm text-label-sm text-primary hover:underline">Take Attendance</Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
