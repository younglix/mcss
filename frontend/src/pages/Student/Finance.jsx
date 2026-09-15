import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError, getAccessToken } from '../../lib/api.js';

const ENDPOINTS = {
  invoices: '/finance/invoices/mine', payments: '/finance/payments/mine', feeItems: '/finance/fee-items/mine',
  restrictions: '/finance/restrictions/mine',
};

const PURPOSE_LABEL = { acceptance_fee: 'Acceptance Fee', first_school_fee: 'First School Fee' };
const STATUS_TONE = { unpaid: 'error', partial: 'warning', paid: 'success', waived: 'secondary' };

export default function StudentFinance() {
  const { user } = useAuth();
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [purchasingId, setPurchasingId] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const feeItems = data?.feeItems || [];
  const restrictions = data?.restrictions || [];

  // Paystack's hosted checkout redirects the browser straight back here
  // with ?reference=...&trxref=... once the payment is done — the webhook
  // (server-to-server) is the authoritative record, but it needs a URL
  // registered in the Paystack dashboard and reachable from Paystack's
  // servers, neither of which is guaranteed. This call is what actually
  // makes the ticket update reliably: it verifies the same reference
  // directly against Paystack from this same request, independent of
  // whether the webhook ever arrives. Safe to run even if the webhook
  // already did its job — both converge on the same idempotent record.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;

    // Strip the query string immediately so a refresh (or a second mount
    // in StrictMode) doesn't re-trigger this against an already-settled
    // reference.
    window.history.replaceState(null, '', window.location.pathname);

    setVerifying(true);
    setVerifyError('');
    api.post('/finance/payments/paystack/verify', { reference })
      .then(() => {
        setVerifyMessage('Payment confirmed — your ticket has been updated.');
        reload();
      })
      .catch((err) => {
        setVerifyError(
          err instanceof ApiError
            ? err.message
            : "We couldn't confirm that payment automatically. If you were charged, it will still be applied shortly — contact the school if it isn't reflected soon.",
        );
      })
      .finally(() => setVerifying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePurchase = async (item) => {
    setPayError('');
    setPurchaseMessage('');
    setPurchasingId(item.id);
    try {
      const result = await api.post(`/finance/fee-items/${item.id}/purchase`, {});
      setPurchaseMessage(
        result.created
          ? `Ticket created for ${item.name} — pay it below whenever you're ready.`
          : `You already have an open ticket for ${item.name} — pay it below whenever you're ready.`,
      );
      reload();
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not create a ticket for this fee item.');
    } finally {
      setPurchasingId(null);
    }
  };

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

        {restrictions.length > 0 && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-error">lock</span>
              <div className="space-y-xs">
                <p className="font-label-md text-label-md font-bold text-on-surface">
                  {restrictions.length === 1 ? '1 restriction is currently in effect' : `${restrictions.length} restrictions are currently in effect`}
                </p>
                {restrictions.map((r) => (
                  <p key={r.restriction_type} className="font-body-sm text-body-sm text-on-surface">{r.message}</p>
                ))}
              </div>
            </div>
          </Card>
        )}

        {verifying && (
          <Card padding="lg" className="border border-secondary/30 bg-secondary-container/10 flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary animate-spin">progress_activity</span>
            <p className="font-body-md text-body-md text-on-surface">Confirming your payment…</p>
          </Card>
        )}
        {!verifying && verifyMessage && (
          <Card padding="lg" className="border border-secondary/30 bg-secondary-container/10">
            <p className="font-body-md text-body-md text-on-surface">{verifyMessage}</p>
          </Card>
        )}
        {!verifying && verifyError && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{verifyError}</p>
          </Card>
        )}

        {(error || payError) && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error || payError}</p>
          </Card>
        )}
        {purchaseMessage && (
          <Card padding="lg" className="border border-secondary/30 bg-secondary-container/10">
            <p className="font-body-md text-body-md text-on-surface">{purchaseMessage}</p>
          </Card>
        )}

        {!loading && feeItems.length > 0 && (
          <div>
            <h2 className="font-headline-md text-headline-sm text-primary mb-md">Available Fee Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {feeItems.map((item) => (
                <Card key={item.id} padding="lg" className="flex flex-col gap-sm">
                  <p className="font-label-md text-label-md font-bold text-on-surface">{item.name}</p>
                  <p className="font-headline-md text-headline-sm text-primary">₦{Number(item.amount).toLocaleString()}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={purchasingId === item.id}
                    onClick={() => handlePurchase(item)}
                  >
                    {purchasingId === item.id ? 'Creating…' : 'Create Ticket'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
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
