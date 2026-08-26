import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=staff_hr', numbering: '/settings/?group=numbering' };

const FIELDS = [
  { key: 'numbering.staff_format', id: 'staff_format', label: 'Staff ID Format', type: 'text', placeholder: 'e.g. STF/{year}/{seq:04}' },
  { key: 'staff_hr.employment_types', id: 'employment_types', label: 'Employment Types (comma-separated)', type: 'text' },
  { key: 'staff_hr.working_hours', id: 'working_hours', label: 'Standard Working Hours', type: 'text' },
  { key: 'staff_hr.leave_days_annual', id: 'leave_days_annual', label: 'Annual Leave Days', type: 'number' },
  { key: 'staff_hr.leave_days_sick', id: 'leave_days_sick', label: 'Sick Leave Days', type: 'number' },
  { key: 'staff_hr.default_tax_rate', id: 'default_tax_rate', label: 'Default Tax Rate (%)', type: 'number' },
];

export default function SuperAdminStaffHRSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    const staffFormat = data.numbering.filter((s) => s.key === 'numbering.staff_format');
    setValues(Object.fromEntries([...data.settings, ...staffFormat].map((s) => [s.key, s.value])));
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
      pageTitle="Staff & HR"
      title="Staff & HR"
      subtitle="Staff numbering and HR policy defaults."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Staff accounts, leave requests, and HR documents are managed in Administration and Operations.
            </p>
            <div className="flex gap-sm">
              <Link to="/super-admin/staff" className="font-label-sm text-label-sm text-primary hover:underline">Staff Management →</Link>
              <Link to="/super-admin/operations/hr" className="font-label-sm text-label-sm text-primary hover:underline">HR (Leave & Documents) →</Link>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved.</p>}
            <Card padding="lg" className="max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
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
