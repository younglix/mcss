import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import FormField from '../../components/ui/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { sessions: '/auth/sessions' };

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">{label}</p>
      <p className="font-body-md text-body-md text-on-surface">{value || '—'}</p>
    </div>
  );
}

/** Generic "My Account" page (identity + password/sessions) shared by every
 * portal that doesn't have its own dedicated Profile/Settings pages
 * (Student and Parent do, and keep their own). Reused via portalId. */
export default function AccountPage({ portalId }) {
  const { user, roles } = useAuth();
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const sessions = data?.sessions || [];

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [revokingId, setRevokingId] = useState(null);

  const handlePasswordChange = async () => {
    setSaving(true);
    setPwMessage('');
    setPwError('');
    try {
      await api.post('/auth/password/change', passwords);
      setPwMessage('Password changed.');
      setPasswords({ current_password: '', new_password: '' });
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (id) => {
    setRevokingId(id);
    try {
      await api.delete(`/auth/sessions/${id}`);
      reload();
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <AppShell portalId={portalId} pageTitle="My Account" user={{ name: user?.full_name }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="My Account" subtitle="Your identity, password, and active sign-ins." />

        <Card padding="lg">
          <div className="flex items-center gap-lg mb-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[32px]">person</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary">{user?.full_name}</h2>
              {roles?.length > 0 && <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">{roles.join(', ')}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
            <Field label="Email" value={user?.email} />
            <Field label="Phone" value={user?.phone} />
            <Field label="Staff ID" value={user?.identifier} />
          </div>
        </Card>

        <Card padding="lg" className="max-w-125">
          <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Change Password</h3>
          {pwError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{pwError}</p>}
          {pwMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{pwMessage}</p>}
          <div className="space-y-md">
            <FormField
              field={{ key: 'current_password', label: 'Current Password', type: 'password' }}
              value={passwords.current_password}
              onChange={(v) => setPasswords((p) => ({ ...p, current_password: v }))}
            />
            <FormField
              field={{ key: 'new_password', label: 'New Password', type: 'password' }}
              value={passwords.new_password}
              onChange={(v) => setPasswords((p) => ({ ...p, new_password: v }))}
            />
            <Button variant="primary" onClick={handlePasswordChange} disabled={saving || !passwords.current_password || !passwords.new_password}>
              {saving ? 'Saving…' : 'Change Password'}
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="font-headline-md text-headline-sm text-primary mb-md">Active Sign-ins</h2>
          {error && (
            <Card padding="lg" className="border border-error/30 bg-error-container/10 mb-md">
              <p className="font-body-md text-body-md text-on-surface">{error}</p>
            </Card>
          )}
          {loading ? (
            <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
          ) : sessions.length === 0 ? (
            <Card padding="lg"><EmptyState icon="devices" text="No active sessions." /></Card>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-125 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Device / Browser</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">IP Address</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Last Used</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">
                          {s.user_agent?.slice(0, 60) || 'Unknown device'} {s.is_current && <span className="text-secondary font-label-sm">(this device)</span>}
                        </td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{s.ip_address || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{s.last_used_at ? new Date(s.last_used_at).toLocaleString() : '—'}</td>
                        <td className="px-lg py-4 text-right">
                          {!s.is_current && (
                            <Button variant="secondary" size="sm" disabled={revokingId === s.id} onClick={() => revokeSession(s.id)}>
                              {revokingId === s.id ? 'Revoking…' : 'Sign Out'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
