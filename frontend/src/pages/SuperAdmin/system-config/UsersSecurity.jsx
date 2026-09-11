import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import SectionShell from './SectionShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=security' };

const PASSWORD_FIELDS = [
  { key: 'security.password_min_length', id: 'password_min_length', label: 'Minimum Password Length', type: 'number' },
  { key: 'security.password_require_uppercase', id: 'password_require_uppercase', label: 'Require an uppercase letter', type: 'checkbox' },
  { key: 'security.password_require_number', id: 'password_require_number', label: 'Require a number', type: 'checkbox' },
  { key: 'security.password_require_symbol', id: 'password_require_symbol', label: 'Require a symbol', type: 'checkbox' },
];

const LOGIN_FIELDS = [
  { key: 'security.max_login_attempts', id: 'max_login_attempts', label: 'Max Failed Login Attempts', type: 'number' },
  { key: 'security.lockout_duration_minutes', id: 'lockout_duration_minutes', label: 'Lockout Window (minutes)', type: 'number' },
  { key: 'security.session_timeout_minutes', id: 'session_timeout_minutes', label: 'Session Timeout (minutes, blank = default)', type: 'number' },
];

const ALERT_FIELDS = [
  { key: 'security.notify_on_failed_login', id: 'notify_on_failed_login', label: 'Alert a user when their account is locked', type: 'checkbox' },
];

/** The Super Admin's global open/closed switch over everyone's self-service
 * Edit Profile screen — a plain wrapper around the existing generic
 * settings endpoint, no dedicated backend route needed for this. */
function SelfEditLockToggle() {
  const [open, setOpen] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useMemo(() => {
    api.get('/settings/profiles.self_edit_open')
      .then((res) => setOpen(!!res.value))
      .catch(() => setError('Could not load the current switch state.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch('/settings/profiles.self_edit_open', { value: !open });
      setOpen((prev) => !prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the switch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-3xl">
      <h2 className="font-headline-md text-headline-md text-primary mb-md">Profile Self-Editing</h2>
      <div className="flex items-center justify-between flex-wrap gap-md">
        <div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            While open, every role can fill in their own Edit Profile screen. Close it once everyone's done — you can
            always reopen it later to let everyone edit again, and you can edit anyone's profile directly at any time
            regardless of this switch.
          </p>
          {error && <p className="font-label-sm text-label-sm text-error mt-xs">{error}</p>}
        </div>
        {loading ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">Loading…</span>
        ) : (
          <Button variant={open ? 'secondary' : 'primary'} onClick={toggle} disabled={saving}>
            {saving ? 'Working…' : open ? 'Close Self-Editing' : 'Open Self-Editing'}
          </Button>
        )}
        {!loading && <Badge tone={open ? 'success' : 'secondary'}>{open ? 'Open' : 'Closed'}</Badge>}
      </div>
    </Card>
  );
}

export default function SuperAdminUsersSecuritySettings() {
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
    <SectionShell loading={loading} error={error} onReload={reload}>
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Individual users, roles, and permission assignments are managed separately.
            </p>
            <div className="flex gap-sm">
              <Link to="/super-admin/administration/user-management" className="font-label-sm text-label-sm text-primary hover:underline">User Management →</Link>
              <Link to="/super-admin/roles" className="font-label-sm text-label-sm text-primary hover:underline">Roles & Permissions →</Link>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved — applies immediately to new logins and password changes.</p>}

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Password Policy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {PASSWORD_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Login Restrictions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {LOGIN_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Security Alerts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {ALERT_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <div className="flex justify-end max-w-3xl">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </form>

          <SelfEditLockToggle />
        </div>
      )}
    </SectionShell>
  );
}
