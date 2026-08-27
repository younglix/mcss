import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import NotificationStrip from '../../components/ui/NotificationStrip.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [report, setReport] = useState(null);
  const [events, setEvents] = useState([]);
  const [latestNotification, setLatestNotification] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/academics/students/my-children'),
      api.get('/calendar/events/mine?audience=parents'),
      api.get('/notifications/?page_size=1'),
    ])
      .then(([kids, evs, notifs]) => {
        setChildren(kids);
        if (kids.length > 0) setActiveChildId(kids[0].id);
        setEvents([...evs].sort((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 4));
        setLatestNotification(notifs[0] || null);
      })
      .catch((err) => setError(err.message || 'Could not load your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeChildId) return;
    setReport(null);
    Promise.all([
      api.get(`/academics/attendance/child/${activeChildId}`),
      api.get(`/finance/invoices/child/${activeChildId}`),
      api.get('/academics/exams/published'),
    ])
      .then(([att, inv, exams]) => {
        setAttendanceRecords(att);
        setInvoices(inv);
        if (exams.length > 0) {
          api.get(`/academics/exams/${exams[0].id}/report-card/${activeChildId}`)
            .then((r) => setReport({ ...r, examName: exams[0].name }))
            .catch(() => setReport(null));
        }
      })
      .catch((err) => setError(err.message || 'Could not load this child\'s records.'));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const attendanceRate = attendanceRecords.length ? Math.round((presentCount / attendanceRecords.length) * 100) : null;
  const outstanding = invoices.reduce((sum, inv) => sum + (inv.status !== 'paid' && inv.status !== 'waived' ? Number(inv.balance) : 0), 0);

  return (
    <AppShell portalId="parent" pageTitle="Parent Dashboard" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Parent'}`}
          subtitle="Manage your children's academic progress and records."
          actions={children.length > 0 && (
            <ChildSwitcher children={childOptions} activeId={activeChildId} onSelect={setActiveChildId} onAdd={() => {}} />
          )}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : children.length === 0 ? (
          <Card padding="lg"><EmptyState icon="family_restroom" text="No children linked to this account yet." /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
            <div className="md:col-span-4">
              <StatCard
                icon="calendar_month"
                iconTone="primary"
                label="Attendance · This Session"
                value={attendanceRate != null ? `${attendanceRate}%` : '—'}
                helperText={attendanceRecords.length ? `${presentCount} of ${attendanceRecords.length} days present` : 'No records yet'}
              />
            </div>

            <Card padding="none" className="md:col-span-8 flex flex-col md:flex-row overflow-hidden">
              <div className="p-lg md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-outline/10 bg-surface-container-low/30">
                <div className="flex items-center gap-sm mb-sm text-secondary">
                  <span className="material-symbols-outlined">trending_up</span>
                  <span className="font-label-md text-label-md">Latest Assessment</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{report?.examName || 'No published results'}</h3>
                <div className="text-5xl font-bold text-primary tracking-tight">
                  {report?.average != null ? report.average : '—'}
                  {report?.average != null && <span className="text-2xl font-medium opacity-50">%</span>}
                </div>
                {report?.class_position && (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-md">Class Position: {report.class_position} of {report.class_size}</p>
                )}
              </div>
              <div className="p-lg md:w-3/5 flex flex-col justify-between">
                <div className="space-y-md">
                  {(report?.subjects || []).slice(0, 5).map((subject) => (
                    <div key={subject.subject} className="flex justify-between items-center">
                      <span className="font-body-md text-body-md">{subject.subject}</span>
                      <span className="font-bold text-primary">{subject.total}/{subject.max_score}</span>
                    </div>
                  ))}
                  {!report && <p className="font-body-md text-body-md text-on-surface-variant">Nothing published yet this session.</p>}
                </div>
                <Button variant="ghost" className="mt-lg self-start px-0" iconRight="arrow_forward" onClick={() => navigate('/parent/results')}>
                  View Full Report Card
                </Button>
              </div>
            </Card>

            <Card className="md:col-span-12 lg:col-span-6 flex items-center gap-lg">
              <div className="p-md bg-tertiary-container text-on-tertiary-container rounded-lg shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-md mb-xs flex-wrap">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Fees & Receipts</h3>
                  <Badge tone={outstanding === 0 ? 'success' : 'warning'} variant="ribbon">
                    {outstanding === 0 ? 'Clear' : 'Balance Due'}
                  </Badge>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Outstanding Balance: <span className="font-bold text-primary">₦{outstanding.toLocaleString()}</span>
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate('/parent/finance')}>View</Button>
            </Card>

            <Card className="md:col-span-12 lg:col-span-6">
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-headline-sm text-headline-sm text-primary">Upcoming Events</h3>
                <button type="button" onClick={() => navigate('/parent/events')} className="material-symbols-outlined text-on-surface-variant">more_horiz</button>
              </div>
              <div className="space-y-md">
                {events.length === 0 ? (
                  <EmptyState icon="event" text="No upcoming events." />
                ) : events.map((event) => {
                  const d = new Date(event.start_at);
                  return (
                    <div key={event.id} className="flex gap-md items-start">
                      <div className="flex flex-col items-center bg-surface-container px-sm py-xs rounded min-w-12.5">
                        <span className="text-label-xs font-bold text-on-surface-variant uppercase">{d.toLocaleString('en-US', { month: 'short' })}</span>
                        <span className="font-headline-sm text-headline-sm text-primary leading-none">{d.getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface">{event.title}</h4>
                        <p className="text-xs text-on-surface-variant">{event.all_day ? 'All day' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {latestNotification && (
              <div className="md:col-span-12">
                <NotificationStrip
                  title={latestNotification.title}
                  message={latestNotification.body}
                  actions={[{ label: 'View All Messages', variant: 'secondary', onClick: () => navigate('/parent/messages') }]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
