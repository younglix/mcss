import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=website' };

const SEO_FIELDS = [
  { key: 'website.meta_title', id: 'meta_title', label: 'Page Title', type: 'text', placeholder: 'Shown in browser tabs and search results' },
  { key: 'website.meta_description', id: 'meta_description', label: 'Meta Description', type: 'textarea', rows: 3 },
];

const SOCIAL_FIELDS = [
  { key: 'website.social_facebook', id: 'social_facebook', label: 'Facebook URL', type: 'text' },
  { key: 'website.social_twitter', id: 'social_twitter', label: 'X / Twitter URL', type: 'text' },
  { key: 'website.social_instagram', id: 'social_instagram', label: 'Instagram URL', type: 'text' },
];

const FOOTER_FIELDS = [
  { key: 'website.footer_text', id: 'footer_text', label: 'Footer Text', type: 'textarea', rows: 2 },
];

export default function SuperAdminWebsiteSettings() {
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
      pageTitle="Website"
      title="Website"
      subtitle="SEO metadata, social links, and footer text for the public site."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              School identity (name, logo, address) and page content are managed elsewhere.
            </p>
            <div className="flex gap-sm">
              <Link to="/super-admin/configuration" className="font-label-sm text-label-sm text-primary hover:underline">School Configuration →</Link>
              <Link to="/super-admin/administration/website-cms" className="font-label-sm text-label-sm text-primary hover:underline">Website / CMS →</Link>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved.</p>}

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">SEO</h2>
              <div className="grid grid-cols-1 gap-lg">
                {SEO_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Social Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {SOCIAL_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Footer</h2>
              <div className="grid grid-cols-1 gap-lg">
                {FOOTER_FIELDS.map((field) => (
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
