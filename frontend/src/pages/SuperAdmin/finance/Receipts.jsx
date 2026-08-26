import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, getAccessToken } from '../../../lib/api.js';

const ENDPOINTS = { payments: '/finance/payments' };

export default function SuperAdminReceipts() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const payments = data?.payments || [];

  const [refundTarget, setRefundTarget] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadReceipt = async (payment) => {
    setDownloadError('');
    setDownloadingId(payment.id);
    try {
      // A real binary PDF response, not the JSON envelope every other
      // endpoint returns — the shared `api` client always calls res.json(),
      // so this needs its own fetch straight to the API.
      const res = await fetch(`/api/v1/finance/payments/${payment.id}/receipt.pdf`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error('Could not generate the receipt.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // A downloaded <a download> click, not window.open(url, '_blank') —
      // modern Chrome blocks navigating a separate tab to a blob: URL it
      // didn't create, so opening a new tab/viewer here reliably fails.
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.receipt_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      setDownloadError(err.message || 'Could not download the receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    try {
      await api.post(`/finance/payments/${refundTarget.id}/refund`, {});
      setRefundTarget(null);
      reload();
    } finally {
      setRefunding(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Receipts" title="Receipts" subtitle="Every payment collected, with its receipt number." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {downloadError && (
        <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{downloadError}</p>
      )}
      {data && (
        payments.length === 0 ? (
          <Card padding="lg">
            <EmptyState icon="receipt" text="No data available yet" />
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Receipt No.</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">For</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Date</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-3 font-body-md text-body-md font-semibold text-on-surface">{p.receipt_number}</td>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.student_name}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{p.invoice_description}</td>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.amount}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="px-lg py-3">
                        <Badge tone={p.status === 'refunded' ? 'secondary' : 'success'}>{p.status}</Badge>
                      </td>
                      <td className="px-lg py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(p)}
                          disabled={downloadingId === p.id}
                          title="Download Receipt"
                          className="p-2 text-outline hover:text-primary transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px]">{downloadingId === p.id ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                        </button>
                        {p.status === 'completed' && (
                          <button type="button" onClick={() => setRefundTarget(p)} title="Refund" className="p-2 text-outline hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[20px]">undo</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      <ConfirmDialog
        open={!!refundTarget}
        title="Refund Payment?"
        message={`This can't be undone. Refund receipt ${refundTarget?.receipt_number}?`}
        confirmLabel="Refund"
        loading={refunding}
        onConfirm={handleRefund}
        onCancel={() => setRefundTarget(null)}
      />
    </DashboardPageShell>
  );
}
