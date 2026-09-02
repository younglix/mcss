import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=student_admission', numbering: '/settings/?group=numbering', sessions: '/config/sessions' };

const NUMBERING_FIELDS = [
  { key: 'numbering.admission_format', id: 'admission_format', label: 'Student ID / Admission Number Format', type: 'text', placeholder: 'e.g. MC/{year}/{seq:04}' },
  { key: 'numbering.application_format', id: 'application_format', label: 'Admission Application Reference Format', type: 'text', placeholder: 'e.g. APP/{year}/{seq:05}' },
];

const ADMISSION_FIELDS = [
  { key: 'student_admission.guardian_required', id: 'guardian_required', label: 'Guardian details required at enrollment', type: 'checkbox' },
  { key: 'student_admission.required_documents', id: 'required_documents', label: 'Required Documents (comma-separated)', type: 'textarea' },
  { key: 'student_admission.admission_requirements', id: 'admission_requirements', label: 'Admission Requirements', type: 'textarea' },
];

export default function SuperAdminStudentAdmissionSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const sessions = data?.sessions || [];

  const today = new Date().toISOString().slice(0, 10);
  const isOpenFlag = !!values?.['student_admission.is_open'];
  const opensAt = values?.['student_admission.opens_at'];
  const closesAt = values?.['student_admission.closes_at'];
  const isEffectivelyOpen = isOpenFlag && (!opensAt || today >= opensAt) && (!closesAt || today <= closesAt);

  if (data && values === null) {
    const numberingSubset = data.numbering.filter((s) => s.key.includes('admission_format') || s.key.includes('application_format'));
    setValues(Object.fromEntries([...data.settings, ...numberingSubset].map((s) => [s.key, s.value])));
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
      pageTitle="Student & Admission"
      title="Student & Admission"
      subtitle="Enrollment numbering and admission requirements."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">Review submitted admission applications.</p>
            <Link to="/super-admin/applicants" className="font-label-sm text-label-sm text-primary hover:underline">Applicant Approvals →</Link>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved — new students and applications will use the updated format.</p>}

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Numbering</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {NUMBERING_FIELDS.map((field) => (
                  <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, [field.key]: v })); }} />
                ))}
              </div>
              <p className="font-label-sm text-label-sm text-outline mt-sm">Use {'{year}'} and {'{seq:0N}'} (zero-padded to N digits) — e.g. MC/{'{year}'}/{'{seq:04}'} → MC/2026/0001.</p>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-md text-headline-md text-primary">Admission Window</h2>
                <Badge tone={isEffectivelyOpen ? 'success' : 'secondary'}>{isEffectivelyOpen ? 'Open' : 'Closed'}</Badge>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-lg">
                The public Apply form only accepts new applications while this is open — nothing here is automatic until you turn it on.
              </p>
              <div className="space-y-lg">
                <FormField
                  field={{ key: 'student_admission.is_open', id: 'admission_is_open', label: 'Applications Open', type: 'checkbox' }}
                  value={values['student_admission.is_open']}
                  onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, 'student_admission.is_open': v })); }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <FormField
                    field={{ key: 'student_admission.opens_at', id: 'admission_opens_at', label: 'Opens On (optional)', type: 'date' }}
                    value={values['student_admission.opens_at']}
                    onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, 'student_admission.opens_at': v })); }}
                  />
                  <FormField
                    field={{ key: 'student_admission.closes_at', id: 'admission_closes_at', label: 'Closes On (optional)', type: 'date' }}
                    value={values['student_admission.closes_at']}
                    onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, 'student_admission.closes_at': v })); }}
                  />
                </div>
                <FormField
                  field={{
                    key: 'student_admission.session', id: 'admission_session', label: 'Admitting For (Academic Session)',
                    type: 'select', options: sessions.map((s) => ({ value: s.id, label: s.name })),
                  }}
                  value={values['student_admission.session']}
                  onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, 'student_admission.session': v })); }}
                />
                <p className="font-label-sm text-label-sm text-outline">
                  Leave the dates blank for an open-ended window controlled purely by the switch above. If both are set, applications close
                  automatically once the date passes — you don't have to remember to come back and turn it off.
                </p>
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Admission Requirements</h2>
              <div className="space-y-lg">
                {ADMISSION_FIELDS.map((field) => (
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
