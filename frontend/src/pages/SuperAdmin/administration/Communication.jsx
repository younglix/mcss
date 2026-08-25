import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../lib/api.js';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Students' },
  { value: 'parent', label: 'Parents' },
  { value: 'applicant', label: 'Applicants' },
];

const FIELDS = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'body', label: 'Message', type: 'textarea', required: true, rows: 5 },
  { key: 'audience', label: 'Audience', type: 'select', required: true, options: AUDIENCE_OPTIONS },
];

export default function SuperAdminCommunication() {
  const { user } = useAuth();
  const [values, setValues] = useState({ title: '', body: '', audience: 'all' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setResult('');
    try {
      const response = await api.post('/notifications/broadcast', values);
      setResult(`Sent to ${response.recipient_count} recipient(s).`);
      setValues({ title: '', body: '', audience: 'all' });
    } catch (err) {
      if (err instanceof ApiError && err.errors && typeof err.errors === 'object') {
        setErrors(err.errors);
      } else {
        setErrors({ __all__: err.message || 'Could not send.' });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell portalId="superAdmin" pageTitle="Communication" user={{ name: user?.full_name || 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Communication"
          subtitle="Broadcast an announcement to a group of users — delivered instantly via the in-app notification bell."
        />
        <Card padding="lg" className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {errors.__all__ && (
              <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
                {errors.__all__}
              </p>
            )}
            {result && (
              <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">
                {result}
              </p>
            )}
            {FIELDS.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                error={errors[field.key]?.[0]}
              />
            ))}
            <div className="flex justify-end pt-md border-t border-outline/10">
              <Button type="submit" variant="primary" iconLeft="campaign" disabled={sending}>
                {sending ? 'Sending…' : 'Send Broadcast'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
