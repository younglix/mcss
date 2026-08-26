import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { invoices: '/finance/invoices', payments: '/finance/payments' };

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'cheque', label: 'Cheque' },
];

export default function SuperAdminPayments() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const outstandingInvoices = (data?.invoices || []).filter((inv) => inv.status === 'unpaid' || inv.status === 'partial');
  const payments = data?.payments || [];

  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedInvoice = outstandingInvoices.find((inv) => inv.id === invoiceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');
    try {
      const result = await api.post('/finance/payments', { invoice: invoiceId, amount, method, reference });
      setSuccessMessage(`Payment recorded — receipt ${result.receipt_number}.`);
      setInvoiceId('');
      setAmount('');
      setReference('');
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Payments" title="Payments" subtitle="Collect fees against an outstanding invoice." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-lg">
              {formError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{formError}</p>}
              {successMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">{successMessage}</p>}
              <FormField
                field={{
                  key: 'invoice', label: 'Invoice', type: 'select', required: true,
                  options: outstandingInvoices.map((inv) => ({ value: inv.id, label: `${inv.student_name} — ${inv.description} (balance ${inv.balance})` })),
                }}
                value={invoiceId}
                onChange={setInvoiceId}
              />
              {selectedInvoice && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">Outstanding balance: {selectedInvoice.balance}</p>
              )}
              <FormField field={{ key: 'amount', label: 'Amount', type: 'number', required: true }} value={amount} onChange={setAmount} />
              <FormField field={{ key: 'method', label: 'Method', type: 'select', required: true, options: METHOD_OPTIONS }} value={method} onChange={setMethod} />
              <FormField field={{ key: 'reference', label: 'Reference (optional)', type: 'text' }} value={reference} onChange={setReference} />
              <div className="flex justify-end pt-md border-t border-outline/10">
                <Button type="submit" variant="primary" iconLeft="point_of_sale" disabled={submitting || !invoiceId}>
                  {submitting ? 'Recording…' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </Card>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Recent Payments</h3>
            {payments.length === 0 ? (
              <Card padding="lg">
                <EmptyState icon="point_of_sale" text="No data available yet" />
              </Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Receipt</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Amount</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Method</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.receipt_number}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.student_name}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.amount}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{p.method.replace('_', ' ')}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant capitalize">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
