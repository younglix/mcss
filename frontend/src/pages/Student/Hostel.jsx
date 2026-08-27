import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { allocations: '/student-services/hostel/allocations/mine' };

export default function StudentHostel() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const allocations = data?.allocations || [];
  const current = allocations.find((a) => !a.vacated_at);

  return (
    <AppShell portalId="student" pageTitle="Hostel" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Hostel" subtitle="Your room allocation and hostel history." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : allocations.length === 0 ? (
          <Card padding="lg"><EmptyState icon="holiday_village" text="You have no hostel allocation." /></Card>
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
