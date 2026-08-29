import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const ENDPOINTS = { payments: '/finance/payments?status=pending' };

export default function BursaryPaymentVerification() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const payments = data?.payments || [];
  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerify = async (payment) => {
    setVerifyingId(payment.id);
    try {
      await api.post(`/finance/payments/${payment.id}/verify`, {});
      reload();
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <DashboardPageShell
      portalId="bursary"
      pageTitle="Payment Verification"
      title="Payment Verification"
      subtitle="Bank transfers, POS, and other incoming payments logged as pending, waiting for confirmation before they credit an invoice."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        payments.length === 0 ? (
          <Card padding="lg">
            <EmptyState icon="verified" text="Nothing waiting on verification." />
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Receipt</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">For</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Method</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Reference</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Logged</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.receipt_number}</td>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.student_name}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{p.invoice_description}</td>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.amount}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{p.method.replace('_', ' ')}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{p.reference || '—'}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="px-lg py-3 text-right">
                        <Button variant="secondary" size="sm" iconLeft="verified" onClick={() => handleVerify(p)} disabled={verifyingId === p.id}>
                          {verifyingId === p.id ? 'Verifying…' : 'Verify'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </DashboardPageShell>
  );
}
