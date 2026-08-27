import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = {
  identity: '/auth/me',
  profile: '/academics/students/mine',
  invoices: '/finance/invoices/mine',
  attendance: '/academics/attendance/mine',
  assignments: '/academics/assignments/mine',
  announcements: '/cms/announcements/active',
  exams: '/academics/exams/published',
};

const QUICK_ACTIONS = [
  { icon: 'grading', label: 'Results', path: '/student/results' },
  { icon: 'event_available', label: 'Attendance', path: '/student/attendance' },
  { icon: 'payments', label: 'Fees & Receipts', path: '/student/finance' },
  { icon: 'calendar_today', label: 'Timetable', path: '/student/timetable' },
  { icon: 'assignment', label: 'Assignments', path: '/student/assignments' },
  { icon: 'menu_book', label: 'Library', path: '/student/library' },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const [average, setAverage] = useState(null);

  const identity = data?.identity?.user;
  const profile = data?.profile;
  const invoices = data?.invoices || [];
  const attendanceRecords = data?.attendance || [];
  const assignments = [...(data?.assignments || [])].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);
  const announcements = (data?.announcements || []).slice(0, 4);
  const exams = data?.exams || [];

  useEffect(() => {
    if (!exams.length || !profile?.id) return;
    api.get(`/academics/exams/${exams[0].id}/report-card/${profile.id}`)
      .then((report) => setAverage(report.average))
      .catch(() => setAverage(null));
  }, [exams, profile]);

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const attendanceRate = attendanceRecords.length ? Math.round((presentCount / attendanceRecords.length) * 100) : null;
  const outstanding = invoices.reduce((sum, inv) => sum + (inv.status !== 'paid' && inv.status !== 'waived' ? Number(inv.balance) : 0), 0);

  return (
    <AppShell portalId="student" pageTitle="Student Dashboard" user={{ name: identity?.full_name || user?.full_name }}>
      <div className="space-y-lg sm:space-y-xl">
        {(error) && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : (
          <>
            <Card padding="lg" className="relative overflow-hidden flex flex-col md:flex-row items-center gap-lg">
              {profile && <Badge tone="success" variant="ribbon" className="absolute top-0 right-0">{profile.status}</Badge>}
              <div className="w-24 h-24 rounded-lg border-4 border-primary/10 bg-primary/5 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[48px]">person</span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Welcome back, {identity?.full_name?.split(' ')[0]}</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  {identity?.full_name} {profile?.class_arm_label && <>· <span className="font-bold text-secondary">{profile.class_arm_label}</span></>}
                </p>
                <div className="flex flex-wrap gap-sm mt-md justify-center md:justify-start">
                  <span className="bg-surface-container px-md py-xs rounded-full font-label-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-body-md">id_card</span> {identity?.identifier}
                  </span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <StatCard
                icon="analytics"
                iconTone="secondary"
                label="Latest Exam Average"
                value={average != null ? `${average}%` : '—'}
                helperText={exams[0]?.name || 'No published results yet'}
              />
              <StatCard
                icon="calendar_month"
                iconTone="tertiary"
                label="Attendance"
                value={attendanceRate != null ? `${attendanceRate}%` : '—'}
                helperText={attendanceRecords.length ? `${presentCount} of ${attendanceRecords.length} days present` : 'No records yet'}
              />
              <StatCard
                icon="account_balance_wallet"
                iconTone="primary"
                label="Outstanding Fees"
                value={`₦${outstanding.toLocaleString()}`}
                valueBadge={outstanding === 0 ? { text: 'Clear', tone: 'success' } : { text: 'Due', tone: 'warning' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
              <Card padding="none" className="lg:col-span-2 overflow-hidden">
                <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">assignment</span>
                    <h2 className="font-headline-md text-headline-md text-primary">Upcoming Assignments</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')}>
                    View All
                  </Button>
                </div>
                <div className="p-lg overflow-x-auto">
                  {assignments.length === 0 ? (
                    <EmptyState icon="assignment" text="No assignments due." />
                  ) : (
                    <table className="w-full min-w-140 text-left border-collapse">
                      <thead>
                        <tr className="bg-primary text-on-primary">
                          <th className="p-md font-label-md text-label-md">Subject</th>
                          <th className="p-md font-label-md text-label-md">Title</th>
                          <th className="p-md font-label-md text-label-md">Due</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-md text-body-md divide-y divide-outline/10">
                        {assignments.map((a) => (
                          <tr key={a.id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="p-md font-bold text-on-surface">{a.subject_name}</td>
                            <td className="p-md">{a.title}</td>
                            <td className="p-md">
                              <Badge tone="secondary">{a.due_date}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>

              <Card padding="none" className="lg:col-span-1 flex flex-col">
                <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex items-center gap-sm">
                  <span className="material-symbols-outlined text-tertiary">campaign</span>
                  <h2 className="font-headline-md text-headline-md text-tertiary">Announcements</h2>
                </div>
                <div className="p-lg flex-1 space-y-md">
                  {announcements.length === 0 ? (
                    <EmptyState icon="campaign" text="No announcements right now." />
                  ) : announcements.map((item) => (
                    <div key={item.id} className="relative pl-md border-l-2 border-outline/20 py-1">
                      <p className="text-xs font-bold uppercase mb-1 text-on-surface-variant">{new Date(item.created_at).toLocaleDateString()}</p>
                      <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-xs">{item.title}</h4>
                      <p className="text-sm text-on-surface-variant line-clamp-2">{item.body}</p>
                    </div>
                  ))}
                </div>
                <div className="p-md border-t border-outline/10">
                  <Button variant="ghost" className="w-full justify-center" iconRight="open_in_new" onClick={() => navigate('/student/announcements')}>
                    View All
                  </Button>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center justify-center p-lg bg-surface-container-lowest border border-outline/10 rounded-lg hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-md group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">
                      {action.icon}
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface">{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
