import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(isoString).toLocaleDateString();
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-sm py-xl text-center">
      <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl">{icon}</span>
      <p className="font-body-md text-body-md text-on-surface-variant">{text}</p>
    </div>
  );
}

function metricValue(metric) {
  if (!metric) return '—';
  if (!metric.available) return '—';
  return metric.value.toLocaleString();
}

function metricHelper(metric) {
  return metric && !metric.available ? 'Module not yet available' : undefined;
}

const SECTIONS = [
  { id: 'overview', label: 'Overview / Statistics' },
  { id: 'financial-summary', label: 'Financial Summary' },
  { id: 'academic-summary', label: 'Academic Summary' },
  { id: 'operations-summary', label: 'Operations Summary' },
  { id: 'recent-activities', label: 'Recent Activities' },
  { id: 'notifications', label: 'Notifications' },
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, financial, academic, operations, recentActivity, notifications] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/financial'),
        api.get('/dashboard/academic'),
        api.get('/dashboard/operations'),
        api.get('/dashboard/recent-activity?limit=8'),
        api.get('/notifications/?page_size=5'),
      ]);
      setData({ summary, financial, academic, operations, recentActivity, notifications });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash]);

  return (
    <AppShell portalId="superAdmin" pageTitle="Super Admin Dashboard" user={{ name: user?.full_name || 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Platform Overview"
          subtitle="Live counts from the database — sections fill in automatically as records are created."
          actions={
            <Button variant="secondary" iconLeft="refresh" onClick={load} disabled={loading}>
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
            <Button variant="secondary" size="sm" onClick={load}>
              Retry
            </Button>
          </Card>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="lg" className="h-32 animate-pulse bg-surface-container-low" />
            ))}
          </div>
        ) : (
          data && (
            <>
              <section id="overview" className="scroll-mt-20">
                <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Overview / Statistics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-lg">
                  <StatCard icon="school" iconTone="primary" label="Students" value={metricValue(data.summary.students)} helperText={metricHelper(data.summary.students)} />
                  <StatCard icon="cast_for_education" iconTone="secondary" label="Teachers" value={metricValue(data.summary.teachers)} helperText={metricHelper(data.summary.teachers)} />
                  <StatCard icon="badge" iconTone="tertiary" label="Staff" value={metricValue(data.summary.staff)} helperText={metricHelper(data.summary.staff)} />
                  <StatCard icon="family_restroom" iconTone="primary" label="Parents" value={metricValue(data.summary.parents)} helperText={metricHelper(data.summary.parents)} />
                  <StatCard icon="class" iconTone="secondary" label="Classes" value={metricValue(data.summary.classes)} helperText={metricHelper(data.summary.classes)} />
                </div>
              </section>

              <section id="financial-summary" className="scroll-mt-20">
                <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Financial Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
                  <StatCard icon="payments" iconTone="success" label="Fees Collected" value={metricValue(data.financial.fees_collected)} helperText={metricHelper(data.financial.fees_collected)} />
                  <StatCard icon="request_quote" iconTone="error" label="Outstanding Fees" value={metricValue(data.financial.outstanding_fees)} helperText={metricHelper(data.financial.outstanding_fees)} />
                  <StatCard icon="point_of_sale" iconTone="primary" label="Today's Payments" value={metricValue(data.financial.todays_payments)} helperText={metricHelper(data.financial.todays_payments)} />
                </div>
              </section>

              <section id="academic-summary" className="scroll-mt-20">
                <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Academic Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
                  <StatCard icon="how_to_reg" iconTone="success" label="Present Today" value={metricValue(data.academic.present_today)} helperText={metricHelper(data.academic.present_today)} />
                  <StatCard icon="event_busy" iconTone="error" label="Absent Today" value={metricValue(data.academic.absent_today)} helperText={metricHelper(data.academic.absent_today)} />
                  <StatCard icon="quiz" iconTone="secondary" label="Upcoming Exams" value={metricValue(data.academic.upcoming_exams)} helperText={metricHelper(data.academic.upcoming_exams)} />
                  <StatCard icon="grading" iconTone="tertiary" label="Pending Results" value={metricValue(data.academic.pending_results)} helperText={metricHelper(data.academic.pending_results)} />
                </div>
              </section>

              <section id="operations-summary" className="scroll-mt-20">
                <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Operations Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
                  <StatCard icon="inventory_2" iconTone="primary" label="Inventory Alerts" value={metricValue(data.operations.inventory_alerts)} helperText={metricHelper(data.operations.inventory_alerts)} />
                  <StatCard icon="menu_book" iconTone="secondary" label="Library Activity" value={metricValue(data.operations.library_activity)} helperText={metricHelper(data.operations.library_activity)} />
                  <StatCard icon="holiday_village" iconTone="tertiary" label="Hostel Occupancy" value={metricValue(data.operations.hostel_occupancy)} helperText={metricHelper(data.operations.hostel_occupancy)} />
                  <StatCard icon="directions_bus" iconTone="primary" label="Transport Status" value={metricValue(data.operations.transport_status)} helperText={metricHelper(data.operations.transport_status)} />
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-xl">
                <section id="recent-activities" className="scroll-mt-20">
                  <div className="flex items-center justify-between mb-md">
                    <h2 className="font-headline-lg text-headline-lg text-primary">Recent Activities</h2>
                    <Link to="/super-admin/audit" className="font-label-md text-label-md text-primary hover:underline">
                      View Full Audit Log
                    </Link>
                  </div>
                  <Card padding={data.recentActivity.length ? 'none' : 'lg'}>
                    {data.recentActivity.length === 0 ? (
                      <EmptyState icon="history" text="No data available yet" />
                    ) : (
                      <ul className="divide-y divide-outline/10">
                        {data.recentActivity.map((entry) => (
                          <li key={entry.id} className="flex items-start gap-md px-lg py-md">
                            <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">history</span>
                            <div className="min-w-0">
                              <p className="font-body-md text-body-md text-on-surface">
                                <span className="font-bold">{entry.actor}</span>{' '}
                                <code className="font-label-sm text-label-sm bg-surface-container px-1.5 py-0.5 rounded">{entry.action}</code>
                                {entry.target_type && <span className="text-on-surface-variant"> — {entry.target_type}</span>}
                              </p>
                              <p className="font-label-sm text-label-sm text-outline mt-0.5">{formatRelativeTime(entry.created_at)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </section>

                <section id="notifications" className="scroll-mt-20">
                  <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Notifications</h2>
                  <Card padding={data.notifications.length ? 'none' : 'lg'}>
                    {data.notifications.length === 0 ? (
                      <EmptyState icon="notifications" text="No data available yet" />
                    ) : (
                      <ul className="divide-y divide-outline/10">
                        {data.notifications.map((notification) => (
                          <li key={notification.id} className="flex items-start gap-md px-lg py-md">
                            <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">
                              {notification.is_read ? 'notifications' : 'notifications_active'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-sm">
                                <p className="font-body-md text-body-md font-bold text-on-surface">{notification.title}</p>
                                {!notification.is_read && <Badge tone="secondary">New</Badge>}
                              </div>
                              <p className="font-body-md text-body-md text-on-surface-variant">{notification.body}</p>
                              <p className="font-label-sm text-label-sm text-outline mt-0.5">{formatRelativeTime(notification.created_at)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </section>
              </div>
            </>
          )
        )}
      </div>
    </AppShell>
  );
}
