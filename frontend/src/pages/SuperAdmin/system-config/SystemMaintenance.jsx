import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=system' };

const FIELDS = [
  { key: 'system.maintenance_enabled', id: 'maintenance_enabled', label: 'Maintenance Mode', type: 'checkbox' },
  {
    key: 'system.maintenance_message', id: 'maintenance_message', label: 'Message shown to everyone else while it\'s on',
    type: 'textarea', rows: 3,
  },
];

export default function SuperAdminSystemMaintenance() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])));
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
      pageTitle="System & Maintenance"
      title="System & Maintenance"
      subtitle="Maintenance mode blocks everyone but Super Admins while it's on."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Every sensitive action and login attempt is recorded automatically.
            </p>
            <Link to="/super-admin/audit" className="font-label-sm text-label-sm text-primary hover:underline">Audit Log →</Link>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved.</p>}

            {values['system.maintenance_enabled'] && (
              <p className="font-label-md text-label-md text-on-error-container bg-error-container/40 border border-error/30 rounded-lg px-md py-sm max-w-3xl">
                Maintenance mode is currently ON — everyone except Super Admins is blocked from the platform.
              </p>
            )}

            <Card padding="lg" className="max-w-3xl">
              <div className="grid grid-cols-1 gap-lg">
                {FIELDS.map((field) => (
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
