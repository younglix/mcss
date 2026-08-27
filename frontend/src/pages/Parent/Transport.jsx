import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

export default function ParentTransport() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/academics/students/my-children')
      .then((data) => {
        setChildren(data);
        if (data.length > 0) setActiveChildId(data[0].id);
        else setLoading(false);
      })
      .catch((err) => { setError(err.message || 'Could not load children.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    api.get(`/student-services/transport/assignments/child/${activeChildId}`)
      .then(setAssignments)
      .catch((err) => setError(err.message || 'Could not load transport assignment.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));

  return (
    <AppShell portalId="parent" pageTitle="Transport" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Transport"
          subtitle="Each child's assigned bus route and pickup point."
          actions={children.length > 0 && (
            <ChildSwitcher children={childOptions} activeId={activeChildId} onSelect={setActiveChildId} onAdd={() => {}} />
          )}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {children.length === 0 && !loading ? (
          <Card padding="lg"><EmptyState icon="family_restroom" text="No children linked to this account yet." /></Card>
        ) : loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : assignments.length === 0 ? (
          <Card padding="lg"><EmptyState icon="directions_bus" text="No transport assignment." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2">
            {assignments.map((a) => (
              <Card key={a.id} padding="lg">
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Route</p>
                <h2 className="font-headline-sm text-headline-sm text-primary">{a.route_name}</h2>
                <p className="font-body-md text-body-md text-on-surface mt-md">Pickup Point: {a.pickup_point || 'Not set'}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Assigned {a.assigned_at}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
