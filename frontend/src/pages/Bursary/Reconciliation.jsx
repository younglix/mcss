import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = { payments: '/finance/payments?status=completed' };

export default function BursaryReconciliation() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const payments = data?.payments || [];
  const unreconciled = payments.filter((p) => !p.is_reconciled);
  const [togglingId, setTogglingId] = useState(null);

  const handleToggle = async (payment) => {
    setTogglingId(payment.id);
    try {
      await api.post(`/finance/payments/${payment.id}/reconcile`, {});
      reload();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <DashboardPageShell
      portalId="bursary"
      pageTitle="Reconciliation"
      title="Reconciliation"
      subtitle="Check off completed payments against the bank statement or gateway settlement report."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <StatCard icon="fact_check" iconTone="secondary" label="Reconciled" value={payments.length - unreconciled.length} />
            <StatCard icon="pending_actions" iconTone="error" label="Awaiting Reconciliation" value={unreconciled.length} />
          </div>

          {payments.length === 0 ? (
            <Card padding="lg"><EmptyState icon="fact_check" text="No completed payments yet." /></Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Receipt</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Method</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Date</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.receipt_number}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.student_name}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.amount}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{p.method.replace('_', ' ')}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{new Date(p.paid_at).toLocaleDateString()}</td>
                        <td className="px-lg py-3">
                          {p.is_reconciled ? <Badge tone="success">Reconciled</Badge> : <Badge tone="warning">Pending</Badge>}
                        </td>
                        <td className="px-lg py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggle(p)}
                            disabled={togglingId === p.id}
                            className="p-2 text-outline hover:text-primary transition-colors disabled:opacity-50"
                            title={p.is_reconciled ? 'Mark unreconciled' : 'Mark reconciled'}
                          >
                            <span className="material-symbols-outlined text-[20px]">{p.is_reconciled ? 'check_box' : 'check_box_outline_blank'}</span>
                          </button>
                        </td>
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
