import { useEffect, useState } from 'react';
import PublicHeader from '../../components/public/PublicHeader.jsx';
import PublicFooter from '../../components/public/PublicFooter.jsx';
import FormField from '../../components/ui/FormField.jsx';
import { api, ApiError } from '../../lib/api.js';

const EMPTY_FORM = {
  staff_type: '', full_name: '', email: '', phone: '', sex: '', date_of_birth: '',
  nin: '', qualification: '', is_form_teacher: false, form_teacher_class_arm: '',
  non_academic_role_title: '',
};

function SubjectClaimRow({ claim, subjects, classArms, onChange, onRemove }) {
  return (
    <div className="flex flex-col sm:flex-row gap-sm items-start sm:items-end p-md rounded-lg border border-outline/15 bg-surface-container-low">
      <div className="flex-1 w-full">
        <FormField
          field={{ key: 'subject', id: `claim_subject_${claim.key}`, label: 'Subject', type: 'select', required: true, options: subjects.map((s) => ({ value: s.id, label: s.name })) }}
          value={claim.subject}
          onChange={(v) => onChange({ ...claim, subject: v })}
        />
      </div>
      <div className="flex-1 w-full">
        <FormField
          field={{ key: 'class_arm', id: `claim_class_${claim.key}`, label: 'Class', type: 'select', required: true, options: classArms.map((a) => ({ value: a.id, label: a.name })) }}
          value={claim.class_arm}
          onChange={(v) => onChange({ ...claim, class_arm: v })}
        />
      </div>
      <button type="button" onClick={onRemove} className="p-2 text-outline hover:text-error transition-colors shrink-0" aria-label="Remove">
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}

export default function StaffOnboarding() {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(false);
  const [values, setValues] = useState(EMPTY_FORM);
  const [claims, setClaims] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = 'Staff Registration | MCSS Portal';
    api.get('/staff-applications/config', { auth: false }).then(setConfig).catch(() => setConfigError(true));
  }, []);

  const update = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));

  const addClaim = () => setClaims((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, subject: '', class_arm: '' }]);
  const updateClaim = (key, next) => setClaims((prev) => prev.map((c) => (c.key === key ? next : c)));
  const removeClaim = (key) => setClaims((prev) => prev.filter((c) => c.key !== key));

  const isNonAcademic = values.staff_type === 'non_academic';
  const isTeacher = values.staff_type === 'teacher';
  const isAcademic = values.staff_type && !isNonAcademic;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const payload = { ...values };
      if (isTeacher) {
        payload.subject_claims = claims
          .filter((c) => c.subject && c.class_arm)
          .map((c) => ({ subject: c.subject, class_arm: c.class_arm }));
      } else {
        delete payload.subject_claims;
      }
      if (!isAcademic) {
        delete payload.nin;
        delete payload.qualification;
        delete payload.sex;
        delete payload.date_of_birth;
      }
      if (!isTeacher || !values.is_form_teacher) {
        payload.form_teacher_class_arm = '';
      }
      if (!isNonAcademic) delete payload.non_academic_role_title;

      // DRF rejects "" for optional DateField/ForeignKey fields (only null
      // or a real value) — omit untouched-blank keys rather than send "".
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== ''));

      await api.post('/staff-applications/submit', cleanPayload, { auth: false });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors && typeof err.errors === 'object') {
        setErrors(err.errors);
      } else {
        setErrors({ __all__: err.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key) => {
    const e = errors[key];
    return Array.isArray(e) ? e[0] : e;
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <PublicHeader />
      <main className="grow max-w-container-max mx-auto px-gutter py-xl w-full">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-xl">
            <h1 className="font-headline-lg text-headline-md text-primary mb-sm">Staff Account Registration</h1>
            <p className="font-body-md text-on-surface-variant">
              If you're already a member of staff at Mount Carmel Secondary School, use this form to create your
              account. The school will review your details before your account goes live.
            </p>
          </header>

          {done ? (
            <div className="bg-surface-container-lowest border border-outline/10 rounded-lg shadow-sm p-xl text-center">
              <span className="material-symbols-outlined text-secondary text-5xl mb-md">task_alt</span>
              <h2 className="font-headline-md text-headline-sm text-primary mb-sm">Application Submitted</h2>
              <p className="font-body-md text-on-surface-variant">
                Thank you — the school will review your details shortly. If approved, your login details will be sent
                to the contact you provided.
              </p>
            </div>
          ) : configError ? (
            <div className="bg-surface-container-lowest border border-outline/10 rounded-lg shadow-sm p-xl text-center">
              <span className="material-symbols-outlined text-error text-5xl mb-md">error</span>
              <h2 className="font-headline-md text-headline-sm text-primary mb-sm">Could Not Load This Form</h2>
              <p className="font-body-md text-on-surface-variant">Please refresh the page or try again shortly.</p>
            </div>
          ) : !config ? (
            <div className="text-center py-xl">
              <p className="font-body-md text-on-surface-variant">Loading…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline/10 rounded-lg shadow-sm p-lg md:p-xl space-y-lg">
              {errors.__all__ && (
                <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
                  {errors.__all__}
                </p>
              )}

              <FormField
                field={{ key: 'staff_type', id: 'staff_type', label: 'Staff Type', type: 'select', required: true, options: config.staff_types }}
                value={values.staff_type}
                onChange={(v) => update('staff_type', v)}
                error={fieldError('staff_type')}
              />

              {values.staff_type && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <FormField field={{ key: 'full_name', id: 'full_name', label: 'Full Name', type: 'text', required: true }} value={values.full_name} onChange={(v) => update('full_name', v)} error={fieldError('full_name')} />
                    <FormField field={{ key: 'email', id: 'email', label: 'Email', type: 'text' }} value={values.email} onChange={(v) => update('email', v)} error={fieldError('email')} />
                    <FormField field={{ key: 'phone', id: 'phone', label: 'Phone', type: 'text' }} value={values.phone} onChange={(v) => update('phone', v)} error={fieldError('phone')} />
                  </div>
                  <p className="font-label-sm text-label-sm text-outline -mt-sm">Provide at least an email or a phone number so the school can reach you.</p>

                  {isNonAcademic && (
                    <FormField
                      field={{ key: 'non_academic_role_title', id: 'non_academic_role_title', label: 'Your Role', type: 'text', required: true, placeholder: 'e.g. Cleaner, Driver, Security Guard' }}
                      value={values.non_academic_role_title}
                      onChange={(v) => update('non_academic_role_title', v)}
                      error={fieldError('non_academic_role_title')}
                    />
                  )}

                  {isAcademic && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        <FormField field={{ key: 'sex', id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] }} value={values.sex} onChange={(v) => update('sex', v)} />
                        <FormField field={{ key: 'date_of_birth', id: 'date_of_birth', label: 'Date of Birth', type: 'date' }} value={values.date_of_birth} onChange={(v) => update('date_of_birth', v)} />
                        <FormField field={{ key: 'nin', id: 'nin', label: 'NIN', type: 'text', required: true }} value={values.nin} onChange={(v) => update('nin', v)} error={fieldError('nin')} />
                        <FormField field={{ key: 'qualification', id: 'qualification', label: 'Qualification', type: 'text', required: true, placeholder: 'e.g. B.Sc Mathematics' }} value={values.qualification} onChange={(v) => update('qualification', v)} error={fieldError('qualification')} />
                      </div>

                      {isTeacher && (
                        <div className="border-t border-outline/10 pt-lg space-y-md">
                          <div>
                            <h3 className="font-label-md text-label-md font-bold text-primary">Subjects &amp; Classes You Teach</h3>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">Add every subject and class combination you currently teach.</p>
                          </div>
                          {fieldError('subject_claims') && <p className="font-label-sm text-label-sm text-error">{fieldError('subject_claims')}</p>}
                          <div className="space-y-sm">
                            {claims.map((claim) => (
                              <SubjectClaimRow
                                key={claim.key}
                                claim={claim}
                                subjects={config.subjects}
                                classArms={config.class_arms}
                                onChange={(next) => updateClaim(claim.key, next)}
                                onRemove={() => removeClaim(claim.key)}
                              />
                            ))}
                          </div>
                          <button type="button" onClick={addClaim} className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">add</span> Add Subject &amp; Class
                          </button>

                          <div className="border-t border-outline/10 pt-md">
                            <label className="flex items-center gap-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={values.is_form_teacher}
                                onChange={(e) => update('is_form_teacher', e.target.checked)}
                                className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                              />
                              <span className="font-label-md text-label-md text-on-surface">I am the form/class teacher of a class</span>
                            </label>
                            {values.is_form_teacher && (
                              <div className="mt-md max-w-sm">
                                <FormField
                                  field={{ key: 'form_teacher_class_arm', id: 'form_teacher_class_arm', label: 'Which Class', type: 'select', required: true, options: config.class_arms.map((a) => ({ value: a.id, label: a.name })) }}
                                  value={values.form_teacher_class_arm}
                                  onChange={(v) => update('form_teacher_class_arm', v)}
                                  error={fieldError('form_teacher_class_arm')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-end pt-md border-t border-outline/10">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-lg py-md bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
                    >
                      {submitting ? 'Submitting…' : 'Submit Application'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
