import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { profile: '/config/school-profile' };

const FIELDS = [
  { key: 'name', label: 'Institution Name', type: 'text', required: true },
  { key: 'motto', label: 'Motto', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'address', label: 'Address', type: 'textarea' },
  { key: 'logo', label: 'Logo URL', type: 'text' },
];

export default function SuperAdminSchoolConfiguration() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && !values) setValues(data.profile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await api.patch('/config/school-profile', values);
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
      pageTitle="School Configuration"
      title="School Configuration"
      subtitle="The school's name, contact details, and branding."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {values && (
        <Card padding="lg" className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && (
              <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
                {saveError}
              </p>
            )}
            {saved && (
              <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">
                Saved.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {FIELDS.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <FormField
                    field={field}
                    value={values[field.key]}
                    onChange={(v) => {
                      setSaved(false);
                      setValues((prev) => ({ ...prev, [field.key]: v }));
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-md border-t border-outline/10">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </DashboardPageShell>
  );
}
