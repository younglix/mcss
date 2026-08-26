import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { useBranding } from '../../../context/BrandingContext.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { profile: '/config/school-profile', settings: '/settings/?group=general' };

const IDENTITY_FIELDS = [
  { key: 'name', label: 'School Name', type: 'text', required: true },
  { key: 'short_name', label: 'Short Name', type: 'text' },
  { key: 'motto', label: 'Slogan / Tagline', type: 'text' },
  { key: 'logo', label: 'Logo URL', type: 'text' },
  { key: 'favicon', label: 'Favicon URL', type: 'text' },
  { key: 'address', label: 'School Address', type: 'textarea' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'country', label: 'Country', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
];

const LOCALE_FIELDS = [
  { key: 'general.language', label: 'Language', type: 'select', options: [{ value: 'en', label: 'English' }] },
  { key: 'general.timezone', label: 'Timezone', type: 'text', placeholder: 'e.g. Africa/Lagos' },
  { key: 'general.currency', label: 'Currency Code', type: 'text', placeholder: 'e.g. NGN' },
  { key: 'general.currency_symbol', label: 'Currency Symbol', type: 'text', placeholder: 'e.g. ₦' },
  {
    key: 'general.date_format', label: 'Date Format', type: 'select',
    options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((v) => ({ value: v, label: v })),
  },
  {
    key: 'general.time_format', label: 'Time Format', type: 'select',
    options: [{ value: '24h', label: '24-hour' }, { value: '12h', label: '12-hour' }],
  },
  { key: 'general.number_format', label: 'Number Format Example', type: 'text' },
  { key: 'general.default_country_code', label: 'Default Country Code', type: 'text', placeholder: 'e.g. +234' },
];

export default function SuperAdminGeneralSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const { refresh: refreshBranding } = useBranding();

  const [identityValues, setIdentityValues] = useState(null);
  const [localeValues, setLocaleValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && identityValues === null) setIdentityValues(data.profile);
  if (data && localeValues === null) {
    setLocaleValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await api.patch('/config/school-profile', identityValues);
      await api.put('/settings/bulk', Object.entries(localeValues).map(([key, value]) => ({ key, value })));
      await refreshBranding();
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
      pageTitle="General"
      title="General"
      subtitle="School identity and locale defaults used across the whole platform."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {identityValues && localeValues && (
        <form onSubmit={handleSubmit} className="space-y-lg">
          {saveError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
              {saveError}
            </p>
          )}
          {saved && (
            <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">
              Saved — the header, sidebar, and login screen now reflect these changes.
            </p>
          )}

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">School Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {IDENTITY_FIELDS.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <FormField
                    field={field}
                    value={identityValues[field.key]}
                    onChange={(v) => { setSaved(false); setIdentityValues((p) => ({ ...p, [field.key]: v })); }}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Locale Defaults</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {LOCALE_FIELDS.map((field) => (
                <FormField
                  key={field.key}
                  field={{ ...field, id: field.key }}
                  value={localeValues[field.key]}
                  onChange={(v) => { setSaved(false); setLocaleValues((p) => ({ ...p, [field.key]: v })); }}
                />
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
