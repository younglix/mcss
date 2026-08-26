import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = {
  email: '/settings/?group=email',
  sms: '/settings/?group=sms',
  whatsapp: '/settings/?group=whatsapp',
  push: '/settings/?group=push',
  notifications: '/settings/?group=notifications',
};

const EMAIL_FIELDS = [
  { key: 'email.host', id: 'email_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.example.com' },
  { key: 'email.port', id: 'email_port', label: 'SMTP Port', type: 'number' },
  { key: 'email.username', id: 'email_username', label: 'SMTP Username', type: 'text' },
  { key: 'email.password', id: 'email_password', label: 'SMTP Password', type: 'password', placeholder: 'Leave blank to keep current' },
  { key: 'email.from', id: 'email_from', label: 'Sender Email', type: 'text', placeholder: 'noreply@school.edu' },
  { key: 'email.use_tls', id: 'email_use_tls', label: 'Use TLS', type: 'checkbox' },
];

const SMS_FIELDS = [
  { key: 'sms.provider', id: 'sms_provider', label: 'SMS Provider', type: 'text', placeholder: 'e.g. Termii' },
  { key: 'sms.sender_id', id: 'sms_sender_id', label: 'Sender ID', type: 'text' },
  { key: 'sms.api_key', id: 'sms_api_key', label: 'API Key', type: 'password', placeholder: 'Leave blank to keep current' },
];

const WHATSAPP_FIELDS = [
  { key: 'whatsapp.provider', id: 'whatsapp_provider', label: 'WhatsApp Provider', type: 'text' },
  { key: 'whatsapp.business_number', id: 'whatsapp_business_number', label: 'Business Number', type: 'text' },
  { key: 'whatsapp.api_key', id: 'whatsapp_api_key', label: 'API Key', type: 'password', placeholder: 'Leave blank to keep current' },
];

const PUSH_FIELDS = [
  { key: 'push.provider', id: 'push_provider', label: 'Push Provider', type: 'text', placeholder: 'e.g. FCM' },
];

const RULE_FIELDS = [
  { key: 'notifications.absentee_alert_enabled', id: 'absentee_alert', label: 'Alert parents on unmarked absence', type: 'checkbox' },
  { key: 'notifications.retention_days', id: 'retention_days', label: 'Keep notifications for (days)', type: 'number' },
];

const CHANNEL_OPTIONS = ['in_app', 'email', 'sms', 'push', 'whatsapp'];

// Secret settings (SMTP password, SMS/WhatsApp API keys) come back from the
// API masked as "••••", never in plaintext. These fields must start blank
// and only be included in the save payload when the admin actually types a
// new value — otherwise saving the form re-submits the literal mask string
// and permanently overwrites the real secret.
const SECRET_KEYS = new Set([...EMAIL_FIELDS, ...SMS_FIELDS, ...WHATSAPP_FIELDS].filter((f) => f.type === 'password').map((f) => f.key));

export default function SuperAdminCommunicationSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [channels, setChannels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    const all = [...data.email, ...data.sms, ...data.whatsapp, ...data.push, ...data.notifications];
    setValues(Object.fromEntries(
      all
        .filter((s) => s.key !== 'notifications.channels')
        .map((s) => [s.key, SECRET_KEYS.has(s.key) ? '' : s.value]),
    ));
    const channelsSetting = data.notifications.find((s) => s.key === 'notifications.channels');
    setChannels(channelsSetting?.value || ['in_app']);
  }

  const toggleChannel = (ch) => {
    setSaved(false);
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const items = [
        ...Object.entries(values)
          .filter(([key, value]) => !(SECRET_KEYS.has(key) && value === ''))
          .map(([key, value]) => ({ key, value })),
        { key: 'notifications.channels', value: channels },
      ];
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
      pageTitle="Communication"
      title="Communication"
      subtitle="Email, SMS, WhatsApp, and push provider configuration, plus default notification channels."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">Compose and send a broadcast to a group of users.</p>
            <Link to="/super-admin/administration/communication" className="font-label-sm text-label-sm text-primary hover:underline">Send Broadcast →</Link>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved.</p>}

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Email</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {EMAIL_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">SMS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {SMS_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Push</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {PUSH_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">WhatsApp</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {WHATSAPP_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Notification Rules</h2>
              <div className="mb-lg">
                <p className="font-label-md text-label-md text-on-surface mb-xs">Default Channels</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm">Where new notifications are sent by default, unless a specific feature overrides it.</p>
                <div className="flex flex-wrap gap-xs">
                  {CHANNEL_OPTIONS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`font-label-sm text-label-sm px-sm py-1 rounded-full border capitalize transition-colors ${
                        channels.includes(ch) ? 'bg-primary text-on-primary border-primary' : 'border-outline/20 text-on-surface-variant'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {RULE_FIELDS.map((field) => (
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
