import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = { notifications: '/notifications/?page_size=50' };

export default function ParentMessages() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const notifications = data?.notifications || [];
  const [marking, setMarking] = useState(false);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.post('/notifications/read-all', {});
      reload();
    } finally {
      setMarking(false);
    }
  };

  const markOneRead = async (id) => {
    await api.post(`/notifications/${id}/read`, {});
    reload();
  };

  return (
    <AppShell portalId="parent" pageTitle="Teacher Communication" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Teacher Communication"
          subtitle="Notices sent to you by the school — attendance, results, payments, and announcements."
          actions={notifications.some((n) => !n.is_read) && (
            <Button variant="secondary" size="sm" onClick={markAllRead} disabled={marking}>Mark All Read</Button>
          )}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : notifications.length === 0 ? (
          <Card padding="lg"><EmptyState icon="forum" text="No messages yet." /></Card>
        ) : (
          <div className="space-y-sm">
            {notifications.map((n) => (
              <Card
                key={n.id}
                padding="lg"
                className={n.is_read ? '' : 'border-l-4 border-primary'}
                onClick={() => !n.is_read && markOneRead(n.id)}
              >
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface">{n.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{n.body}</p>
                  </div>
                  <p className="font-label-sm text-label-sm text-outline whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
