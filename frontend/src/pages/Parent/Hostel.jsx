import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

export default function ParentHostel() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [allocations, setAllocations] = useState([]);
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
    api.get(`/student-services/hostel/allocations/child/${activeChildId}`)
      .then(setAllocations)
      .catch((err) => setError(err.message || 'Could not load hostel allocation.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));
  const current = allocations.find((a) => !a.vacated_at);

  return (
    <AppShell portalId="parent" pageTitle="Hostel" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Hostel"
          subtitle="Each child's room allocation and hostel history."
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
        ) : allocations.length === 0 ? (
          <Card padding="lg"><EmptyState icon="holiday_village" text="No hostel allocation." /></Card>
        ) : (
          <>
            {current && (
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">Current Room</p>
                <h2 className="font-headline-sm text-headline-sm text-primary">{current.room_label}</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Allocated {current.allocated_at}</p>
              </Card>
            )}
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-125 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Room</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Allocated</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {allocations.map((a) => (
                      <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{a.room_label}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.allocated_at}</td>
                        <td className="px-lg py-4"><Badge tone={a.vacated_at ? 'secondary' : 'success'}>{a.vacated_at ? 'Vacated' : 'Active'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
