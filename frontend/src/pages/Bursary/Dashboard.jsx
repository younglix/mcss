import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = {
  reports: '/finance/reports',
  outstanding: '/finance/outstanding',
  payments: '/finance/payments',
  pendingPayments: '/finance/payments?status=pending',
};

const STATUS_TONE = { completed: 'success', pending: 'warning', refunded: 'secondary' };

function LiveDataBadge() {
  return (
    <div className="bg-surface-container-low px-md py-xs rounded-full flex items-center gap-xs">
      <span className="w-2 h-2 rounded-full animate-pulse bg-tertiary" />
      <span className="font-label-sm text-label-sm text-on-surface-variant">Live Financial Data</span>
    </div>
  );
}

export default function BursaryDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(ENDPOINTS);
  const report = data?.reports;
  const debtors = data?.outstanding || [];
  const recentPayments = (data?.payments || []).slice(0, 8);
  const pendingCount = data?.pendingPayments?.length || 0;

  const collected = Number(report?.total_collected || 0);
  const outstanding = Number(report?.outstanding || 0);
  const collectionRate = collected + outstanding > 0 ? Math.round((collected / (collected + outstanding)) * 100) : 0;

  return (
    <AppShell portalId="bursary" pageTitle="Bursary Dashboard" user={{ name: user?.full_name || 'Bursar' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Bursary Dashboard"
          subtitle={report?.session ? `Financial overview for ${report.session}.` : 'Financial overview.'}
          actions={<LiveDataBadge />}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
              <Card padding="lg" className="md:col-span-8 flex flex-col md:flex-row items-center gap-xl relative overflow-hidden">
                <div className="flex-1 space-y-md z-10">
                  <span className="font-label-md text-label-md text-primary bg-primary/5 px-md py-xs rounded-full inline-block">
                    Collection Rate
                  </span>
                  <h3 className="font-headline-lg text-headline-lg text-primary">Total Fees Collected</h3>
                  <div className="flex items-baseline gap-xs">
                    <span className="font-headline-xl text-headline-xl text-primary">₦{collected.toLocaleString()}</span>
                    <span className="text-on-surface-variant font-label-md text-label-md">/ ₦{(collected + outstanding).toLocaleString()} invoiced (net of discounts)</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    <span className="font-bold text-secondary">₦{outstanding.toLocaleString()}</span> still outstanding across {debtors.length} student(s).
                  </p>
                  <div className="flex flex-wrap gap-md pt-md">
                    <Button variant="primary" iconLeft="summarize" to="/bursary/reports">Financial Reports</Button>
                    <Button variant="secondary" to="/bursary/outstanding-fees">View Debtors</Button>
                  </div>
                </div>
                <ProgressRing percent={collectionRate} label={`${collectionRate}%`} sublabel="Collected" />
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0" />
              </Card>

              <Card padding="lg" className="md:col-span-4 bg-tertiary text-on-tertiary flex flex-col justify-between border-none">
                <div>
                  <div className="flex justify-between items-start mb-md">
                    <span className="material-symbols-outlined text-headline-lg">account_balance_wallet</span>
                    <span className="bg-on-tertiary/15 text-on-tertiary px-md py-xs rounded-full font-label-sm text-label-sm">
                      High Priority
                    </span>
                  </div>
                  <h4 className="font-headline-md text-headline-md">Outstanding Balances</h4>
                  <p className="font-headline-xl text-headline-lg mt-sm">₦{outstanding.toLocaleString()}</p>
                </div>
                <div className="space-y-sm mt-lg">
                  {debtors.slice(0, 3).map((d) => (
                    <div key={d.student} className="flex justify-between text-body-md border-b border-on-tertiary/20 pb-xs">
                      <span className="text-on-tertiary/70">{d.student_name}</span>
                      <span className="font-bold">₦{Number(d.balance).toLocaleString()}</span>
                    </div>
                  ))}
                  {debtors.length === 0 && <p className="text-xs italic text-on-tertiary/60">No outstanding balances.</p>}
                  <p className="text-xs italic text-on-tertiary/60 mt-sm">Total {debtors.length} student(s) remaining</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
              <div className="lg:col-span-4 space-y-lg">
                <Card padding="none">
                  <div className="bg-surface-container-high px-lg py-md border-b border-outline/10">
                    <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary">Collections by Category</h3>
                  </div>
                  <div className="p-lg space-y-md">
                    {(report?.collected_by_category || []).length === 0 ? (
                      <p className="font-body-sm text-body-sm text-on-surface-variant italic">No data available yet.</p>
                    ) : (
                      report.collected_by_category.slice(0, 5).map((row) => {
                        const max = Math.max(...report.collected_by_category.map((r) => Number(r.total)), 1);
                        const percent = Math.round((Number(row.total) / max) * 100);
                        return (
                          <div key={row.category} className="space-y-xs">
                            <div className="flex justify-between font-label-md text-label-md">
                              <span>{row.category}</span>
                              <span className="text-primary font-bold">₦{Number(row.total).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                <Card padding="lg" className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary text-headline-lg-mobile">info</span>
                  <div>
                    <h4 className="font-label-md text-label-md text-primary mb-xs">
                      {pendingCount > 0 ? `${pendingCount} Payment(s) Pending Verification` : 'All Payments Verified'}
                    </h4>
                    <p className="text-body-md text-on-surface-variant">
                      {pendingCount > 0
                        ? 'Bank transfers and POS payments logged as pending are waiting for confirmation.'
                        : 'Nothing is waiting on verification right now.'}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-sm px-0" to="/bursary/payment-verification">
                      {pendingCount > 0 ? 'Review Now' : 'Payment Verification'}
                    </Button>
                  </div>
                </Card>
              </div>

              <Card padding="none" className="lg:col-span-8 overflow-hidden">
                <div className="bg-surface-container-high px-lg py-md border-b border-outline/10 flex justify-between items-center">
                  <h3 className="font-headline-md text-headline-md text-primary">Recent Transactions</h3>
                  <Button variant="ghost" size="sm" iconRight="chevron_right" to="/bursary/receipts">
                    View All History
                  </Button>
                </div>
                {recentPayments.length === 0 ? (
                  <div className="p-lg"><EmptyState icon="receipt_long" text="No payments recorded yet." /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-150 border-collapse">
                      <thead>
                        <tr className="bg-primary text-on-primary text-left">
                          <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Receipt</th>
                          <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Student</th>
                          <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Amount</th>
                          <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Status</th>
                          <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-body-md font-body-md divide-y divide-outline/10">
                        {recentPayments.map((tx) => (
                          <tr key={tx.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-lg py-md text-on-surface-variant font-mono">{tx.receipt_number}</td>
                            <td className="px-lg py-md font-bold text-primary">{tx.student_name}</td>
                            <td className="px-lg py-md font-bold">₦{Number(tx.amount).toLocaleString()}</td>
                            <td className="px-lg py-md">
                              <Badge tone={STATUS_TONE[tx.status] || 'secondary'}>{tx.status}</Badge>
                            </td>
                            <td className="px-lg py-md text-on-surface-variant">{new Date(tx.paid_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
