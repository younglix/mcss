import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { outstanding: '/finance/outstanding' };

export default function BursaryOutstandingFees() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const rows = data?.outstanding || [];

  return (
    <DashboardPageShell
      portalId="bursary"
      pageTitle="Outstanding Fees"
      title="Outstanding Fees"
      subtitle="Every student with a balance owing, school-wide — sorted by how much they owe."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <StatCard icon="assignment_late" iconTone="error" label="Total Outstanding" value={rows.reduce((sum, r) => sum + Number(r.balance), 0).toLocaleString()} />
            <StatCard icon="groups" label="Debtors" value={rows.length} />
          </div>

          {rows.length === 0 ? (
            <Card padding="lg"><EmptyState icon="assignment_late" text="No outstanding balances — everyone's paid up." /></Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Unpaid Invoices</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {rows.map((r) => (
                      <tr key={r.student}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{r.student_name}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{r.class_arm_label || '—'}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{r.invoice_count}</td>
                        <td className="px-lg py-3 font-body-md text-body-md font-semibold text-error">{Number(r.balance).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
