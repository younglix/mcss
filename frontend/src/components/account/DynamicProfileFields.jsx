import { useEffect, useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import FormField from '../ui/FormField.jsx';
import { api, ApiError } from '../../lib/api.js';

/** Self-service "Edit Profile" (Requirement 1) — whatever extra fields the
 * Super Admin has defined for this user's own account type (staff, parent,
 * or student), fetched from /custom-fields/my-values. A sensitive field
 * (NIN, bank account, ...) that's already saved comes back masked — even to
 * the person who entered it — and resaving the form leaves a masked field
 * untouched rather than overwriting it with the placeholder text.
 *
 * Locked (the Super Admin's global switch is closed) means read-only: the
 * fields still render so the user can see what's on file, but there's no
 * Save button. Mount this inside any portal's profile/account page. */
export default function DynamicProfileFields() {
  const [entity, setEntity] = useState(null);
  const [locked, setLocked] = useState(false);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/custom-fields/my-values')
      .then((res) => {
        setEntity(res.entity);
        setLocked(res.locked);
        setFields(res.fields || []);
        setValues(Object.fromEntries((res.fields || []).map((f) => [f.field_id, f.value ?? ''])));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your profile.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put('/custom-fields/my-values', {
        values: fields.map((f) => ({ field_id: f.field_id, value: values[f.field_id] ?? null })),
      });
      setMessage('Profile saved.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  // Nothing to show for account types the Super Admin hasn't configured any
  // extra fields for yet (or applicants, who have no self-service profile).
  if (!loading && (entity === null || fields.length === 0)) return null;

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-md">
        <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs flex-1">Additional Information</h3>
        {!loading && locked && <Badge tone="secondary">Locked</Badge>}
      </div>

      {error && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{error}</p>}
      {message && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{message}</p>}

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-md">
          {locked && (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Editing is currently closed. Contact the school administrator if something here needs correcting.
            </p>
          )}
          {fields.map((f) => (
            <div key={f.field_id}>
              <FormField
                field={{
                  key: f.field_id, label: f.label, type: f.field_type, required: f.required,
                  options: (f.options || []).map((o) => ({ value: o, label: o })),
                }}
                value={values[f.field_id] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.field_id]: v }))}
              />
              {f.is_masked && (
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Saved — hidden for privacy. Only the Super Admin can view it in full. Type a new value to replace it.
                </p>
              )}
            </div>
          ))}
          {!locked && (
            <div className="flex justify-end pt-sm">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
