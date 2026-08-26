import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=finance', numbering: '/settings/?group=numbering' };

const NUMBERING_FIELDS = [
  { key: 'numbering.invoice_format', id: 'invoice_format', label: 'Invoice Number Format', type: 'text' },
  { key: 'numbering.receipt_format', id: 'receipt_format', label: 'Receipt / Payment Number Format', type: 'text' },
  { key: 'numbering.expense_format', id: 'expense_format', label: 'Expense Number Format', type: 'text' },
];

const POLICY_FIELDS = [
  { key: 'finance.late_fee_percent', id: 'late_fee_percent', label: 'Late Fee (%)', type: 'number' },
  { key: 'finance.late_fee_grace_days', id: 'late_fee_grace_days', label: 'Late Fee Grace Period (days)', type: 'number' },
  { key: 'finance.default_discount_percent', id: 'default_discount_percent', label: 'Default Discount (%)', type: 'number' },
  { key: 'finance.tax_percent', id: 'tax_percent', label: 'Tax Rate (%)', type: 'number' },
  {
    key: 'finance.financial_year_start_month', id: 'financial_year_start_month', label: 'Financial Year Start Month', type: 'select',
    options: Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }) })),
  },
];

export default function SuperAdminFinanceSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    const numberingSubset = data.numbering.filter((s) => ['invoice_format', 'receipt_format', 'expense_format'].some((k) => s.key.endsWith(k)));
    setValues(Object.fromEntries([...data.settings, ...numberingSubset].map((s) => [s.key, s.value])));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await api.put('/settings/bulk', Object.entries(values).map(([key, value]) => ({ key, value })));
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardPageShell
      pageTitle="Finance"
      title="Finance"
      subtitle="Document numbering and fee/payment policy defaults."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Fee structures, invoices, payments, and payroll are managed in Finance.
            </p>
            <Link to="/super-admin/finance/fee-structures" className="font-label-sm text-label-sm text-primary hover:underline">Finance Module →</Link>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved — new invoices, receipts, and expenses will use the updated format.</p>}

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Numbering</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {NUMBERING_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Policy Defaults</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {POLICY_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <div className="flex justify-end max-w-3xl">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      )}
    </DashboardPageShell>
  );
}
