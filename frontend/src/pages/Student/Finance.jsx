import { useMemo, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError, getAccessToken } from '../../lib/api.js';

const ENDPOINTS = { invoices: '/finance/invoices/mine', payments: '/finance/payments/mine' };

const PURPOSE_LABEL = { acceptance_fee: 'Acceptance Fee', first_school_fee: 'First School Fee' };
const STATUS_TONE = { unpaid: 'error', partial: 'warning', paid: 'success', waived: 'secondary' };

export default function StudentFinance() {
  const { user } = useAuth();
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  const handlePay = async (invoice) => {
    setPayError('');
    setPayingId(invoice.id);
    try {
      const result = await api.post(`/finance/invoices/${invoice.id}/pay`, {});
      window.location.href = result.payment_url;
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not start the payment.');
    } finally {
      setPayingId(null);
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    setDownloadingId(paymentId);
    try {
      const res = await fetch(`/api/v1/finance/payments/${paymentId}/receipt.pdf`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error('Could not generate the receipt.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setPayError('Could not download the receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppShell portalId="student" pageTitle="Fees & Receipts" user={{ name: user?.full_name || 'Student' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Fees & Receipts" subtitle="Every fee ticket you owe, and every payment you've made — pay online whenever a ticket is outstanding, and download the receipt once it's paid." />

        {(error || payError) && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error || payError}</p>
          </Card>
        )}

        {loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : invoices.length === 0 ? (
          <Card padding="lg"><EmptyState icon="receipt_long" text="No invoices yet." /></Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Fee Ticket</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Balance</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">
                        {PURPOSE_LABEL[inv.purpose] || inv.description}
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">₦{Number(inv.amount).toLocaleString()}</td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">₦{Number(inv.balance).toLocaleString()}</td>
                      <td className="px-lg py-4"><Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge></td>
                      <td className="px-lg py-4 text-right">
                        {(inv.status === 'unpaid' || inv.status === 'partial') && (
                          <Button variant="primary" size="sm" disabled={payingId === inv.id} onClick={() => handlePay(inv)}>
                            {payingId === inv.id ? 'Starting…' : 'Pay Now'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="pt-md">
          <h2 className="font-headline-md text-headline-sm text-primary mb-md">Payment History</h2>
          {payments.length === 0 ? (
            <Card padding="lg"><EmptyState icon="history" text="No payments recorded yet." /></Card>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Receipt No.</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Method</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Date</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{p.receipt_number}</td>
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{p.method?.replace('_', ' ')}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{new Date(p.paid_at).toLocaleDateString()}</td>
                        <td className="px-lg py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p.id, p.receipt_number)}
                            disabled={downloadingId === p.id}
                            title="Download Receipt"
                            className="p-2 text-outline hover:text-primary transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[20px]">{downloadingId === p.id ? 'hourglass_empty' : 'picture_as_pdf'}</span>
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
      </div>
    </AppShell>
  );
}
