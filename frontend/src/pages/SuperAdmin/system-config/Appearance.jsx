import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { useBranding } from '../../../context/BrandingContext.jsx';
import { applyRadiusOverride, applyTypographyOverrides, RADIUS_SCALE_OPTIONS } from '../../../lib/colorTokens.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=appearance' };

const THEME_FIELDS = [
  { key: 'appearance.primary_color', label: 'Primary Color', type: 'color' },
  { key: 'appearance.secondary_color', label: 'Secondary Color', type: 'color' },
  {
    key: 'appearance.radius_scale', label: 'Border Radius', type: 'select',
    options: RADIUS_SCALE_OPTIONS.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
  },
];

const TYPOGRAPHY_FIELDS = [
  { key: 'appearance.heading_font', label: 'Heading Font', type: 'text' },
  { key: 'appearance.primary_font', label: 'Primary Font', type: 'text' },
  { key: 'appearance.body_font', label: 'Body Font', type: 'text' },
  { key: 'appearance.base_font_size', label: 'Base Font Size (px)', type: 'number' },
];

const BRANDING_FIELDS = [
  { key: 'appearance.light_logo', label: 'Light Logo URL', type: 'text' },
  { key: 'appearance.dark_logo', label: 'Dark Logo URL', type: 'text' },
  { key: 'appearance.landscape_logo', label: 'Landscape Logo URL', type: 'text' },
  { key: 'appearance.school_seal', label: 'School Seal / Stamp URL', type: 'text' },
];

const BRANDING_TOGGLES = [
  { key: 'appearance.pdf_branding_enabled', label: 'Apply branding to generated PDFs' },
  { key: 'appearance.report_branding_enabled', label: 'Apply branding to report cards' },
  { key: 'appearance.invoice_branding_enabled', label: 'Apply branding to invoices / receipts' },
  { key: 'appearance.certificate_branding_enabled', label: 'Apply branding to certificates' },
];

export default function SuperAdminAppearanceSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const { refresh: refreshBranding } = useBranding();

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
      // Color overrides aren't applied directly here — refreshBranding()
      // below updates BrandingContext, and BrandColorSync (mounted at the
      // app root) reactively re-derives them against the current light/dark
      // theme, which a direct call here has no way to know.
      applyTypographyOverrides({
        headingFont: values['appearance.heading_font'],
        primaryFont: values['appearance.primary_font'],
        bodyFont: values['appearance.body_font'],
        baseFontSize: values['appearance.base_font_size'],
      });
      applyRadiusOverride(values['appearance.radius_scale']);
      await refreshBranding();
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key, v) => {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  return (
    <DashboardPageShell
      pageTitle="Appearance"
      title="Appearance"
      subtitle="Theme colors, typography, and branding — applied across the whole platform immediately on save."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {values && (
        <form onSubmit={handleSubmit} className="space-y-lg">
          {saveError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
              {saveError}
            </p>
          )}
          {saved && (
            <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">
              Saved and applied.
            </p>
          )}

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Theme</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              {THEME_FIELDS.map((field) => (
                <FormField key={field.key} field={{ ...field, id: field.key }} value={values[field.key]} onChange={(v) => update(field.key, v)} />
              ))}
            </div>
          </Card>

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {TYPOGRAPHY_FIELDS.map((field) => (
                <FormField key={field.key} field={{ ...field, id: field.key }} value={values[field.key]} onChange={(v) => update(field.key, v)} />
              ))}
            </div>
          </Card>

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Branding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
              {BRANDING_FIELDS.map((field) => (
                <FormField key={field.key} field={{ ...field, id: field.key }} value={values[field.key]} onChange={(v) => update(field.key, v)} />
              ))}
            </div>
            <div className="space-y-xs border-t border-outline/10 pt-md">
              {BRANDING_TOGGLES.map((field) => (
                <FormField
                  key={field.key}
                  field={{ key: field.key, id: field.key, label: field.label, type: 'checkbox' }}
                  value={values[field.key]}
                  onChange={(v) => update(field.key, v)}
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
