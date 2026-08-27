import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, getAccessToken } from '../../lib/api.js';

const PURPOSE_LABEL = { acceptance_fee: 'Acceptance Fee', first_school_fee: 'First School Fee' };
const STATUS_TONE = { unpaid: 'error', partial: 'warning', paid: 'success', waived: 'secondary' };

export default function ParentFinance() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.get('/academics/students/my-children')
      .then((data) => {
        setChildren(data);
        if (data.length > 0) setActiveChildId(data[0].id);
      })
      .catch((err) => setError(err.message || 'Could not load children.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    Promise.all([
      api.get(`/finance/invoices/child/${activeChildId}`),
      api.get(`/finance/payments/child/${activeChildId}`),
    ])
      .then(([inv, pay]) => { setInvoices(inv); setPayments(pay); })
      .catch((err) => setError(err.message || 'Could not load fees.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

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
      setError('Could not download the receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));

  return (
    <AppShell portalId="parent" pageTitle="Fees" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="School Fees"
          subtitle="What each child owes, and their full payment history. Fees are paid from the student's own portal."
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
        ) : (
          <>
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Description</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Balance</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {invoices.length === 0 ? (
                      <tr><td colSpan={4} className="px-lg py-6"><EmptyState icon="receipt_long" text="No invoices yet." /></td></tr>
                    ) : invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{PURPOSE_LABEL[inv.purpose] || inv.description}</td>
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">₦{Number(inv.amount).toLocaleString()}</td>
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">₦{Number(inv.balance).toLocaleString()}</td>
                        <td className="px-lg py-4"><Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="pt-md">
              <h2 className="font-headline-md text-headline-sm text-primary mb-md">Payment History</h2>
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
                      {payments.length === 0 ? (
                        <tr><td colSpan={5} className="px-lg py-6"><EmptyState icon="history" text="No payments recorded yet." /></td></tr>
                      ) : payments.map((p) => (
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
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
