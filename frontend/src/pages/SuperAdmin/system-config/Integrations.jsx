import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=payments' };

const PAYSTACK_FIELDS = [
  { key: 'payments.paystack.public_key', id: 'paystack_public_key', label: 'Public Key', type: 'text' },
  { key: 'payments.paystack.secret_key', id: 'paystack_secret_key', label: 'Secret Key', type: 'password', placeholder: 'Leave blank to keep current' },
];

const FLUTTERWAVE_FIELDS = [
  { key: 'payments.flutterwave.public_key', id: 'flutterwave_public_key', label: 'Public Key', type: 'text' },
  { key: 'payments.flutterwave.secret_key', id: 'flutterwave_secret_key', label: 'Secret Key', type: 'password', placeholder: 'Leave blank to keep current' },
];

// Secret settings come back from the API masked, never in plaintext — start
// blank and only include in the save payload when actually changed, same
// pattern as Communication settings' SMTP password / SMS API key.
const SECRET_KEYS = new Set([...PAYSTACK_FIELDS, ...FLUTTERWAVE_FIELDS].filter((f) => f.type === 'password').map((f) => f.key));

export default function SuperAdminIntegrations() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    setValues(Object.fromEntries(data.settings.map((s) => [s.key, SECRET_KEYS.has(s.key) ? '' : s.value])));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const items = Object.entries(values)
        .filter(([key, value]) => !(SECRET_KEYS.has(key) && value === ''))
        .map(([key, value]) => ({ key, value }));
      await api.put('/settings/bulk', items);
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
      pageTitle="Integrations"
      title="Integrations"
      subtitle="Payment gateway credentials for online fee collection."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <form onSubmit={handleSubmit} className="space-y-lg">
          {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
          {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved.</p>}

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Paystack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {PAYSTACK_FIELDS.map((field) => (
                <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
              ))}
            </div>
          </Card>

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Flutterwave</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {FLUTTERWAVE_FIELDS.map((field) => (
                <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
              ))}
            </div>
          </Card>

          <div className="flex justify-end max-w-3xl">
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </form>
      )}
    </DashboardPageShell>
  );
}
