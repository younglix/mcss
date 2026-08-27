import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { loans: '/student-services/library/loans/mine' };

export default function StudentLibrary() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const loans = data?.loans || [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell portalId="student" pageTitle="Library" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Library" subtitle="Books you've borrowed, due dates, and return status." />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : loans.length === 0 ? (
          <Card padding="lg"><EmptyState icon="menu_book" text="You haven't borrowed any books yet." /></Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Book</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Borrowed</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Due</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {loans.map((l) => {
                    const overdue = !l.returned_at && l.due_date < today;
                    return (
                      <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{l.book_title || l.book}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{l.borrowed_at}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{l.due_date}</td>
                        <td className="px-lg py-4">
                          <Badge tone={l.returned_at ? 'secondary' : overdue ? 'error' : 'success'}>
                            {l.returned_at ? 'Returned' : overdue ? 'Overdue' : 'Borrowed'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
