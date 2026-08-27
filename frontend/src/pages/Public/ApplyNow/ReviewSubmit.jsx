import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import ApplyStepper from '../../../components/public/ApplyStepper.jsx';
import { api, ApiError } from '../../../lib/api.js';
import { clearDraft, getDraft, saveResult } from './applyDraft.js';
import { uploadSlots } from './applyData.js';

export default function ApplyReviewSubmit() {
  const navigate = useNavigate();
  const [declared, setDeclared] = useState(false);
  const [draft] = useState(getDraft());
  const [classOptions, setClassOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Apply: Review & Submit | MCSS Portal';
    if (!draft.surname) {
      navigate('/apply/bio-data');
      return;
    }
    api.get('/config/public-classes', { auth: false }).then(setClassOptions).catch(() => {});
  }, [draft, navigate]);

  const className = classOptions.find((c) => c.id === draft.class_applying_for)?.name;
  const fullName = [draft.surname, draft.first_name, draft.middle_name].filter(Boolean).join(' ');

  const bioFields = [
    ['Full Legal Name', fullName],
    ['Level', draft.level === 'primary' ? 'Primary' : 'Secondary'],
    ['Date of Birth', draft.date_of_birth || '—'],
    ['Present Class', draft.present_class || '—'],
    ['Applying For', className || '—'],
  ];

  const readyDocs = Object.entries(draft.documents_ready || {}).filter(([, v]) => v).map(([k]) => k);

  const SUBMIT_FIELDS = [
    'level', 'surname', 'first_name', 'middle_name', 'date_of_birth', 'gender',
    'present_class', 'schools_attended', 'religion', 'religion_other',
    'nationality', 'state_of_origin', 'email', 'phone', 'address',
    'has_guardian', 'guardian_name', 'guardian_phone', 'guardian_email',
    'father_name', 'father_occupation', 'father_phone', 'father_place_of_work',
    'father_home_address', 'father_office_address', 'father_email',
    'mother_name', 'mother_occupation', 'mother_phone', 'mother_place_of_work',
    'mother_home_address', 'mother_office_address', 'mother_email',
    'siblings_in_school', 'guardian_signature_name',
    'class_applying_for', 'previous_school',
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.fromEntries(SUBMIT_FIELDS.map((key) => [key, draft[key] ?? '']));
      const result = await api.post('/admissions/apply', payload, { auth: false });

      const customFieldValues = draft.customFieldValues || {};
      const fieldIds = Object.keys(customFieldValues);
      if (fieldIds.length > 0 && result.id) {
        await api.put('/custom-fields/values/bulk', {
          entity: 'application', entity_id: result.id,
          values: fieldIds.map((field_id) => ({ field_id, value: customFieldValues[field_id] })),
        }, { auth: false }).catch(() => {}); // best-effort — the core application is already submitted either way
      }

      saveResult(result);
      clearDraft();
      navigate('/apply/confirmation');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <PublicHeader />
      <main className="grow pb-xl px-gutter max-w-container-max mx-auto w-full pt-xl">
        <header className="mb-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
            <div>
              <h1 className="font-headline-xl text-headline-lg text-primary leading-tight">Step 4: Review &amp; Submit</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Final verification of your application profile. Please ensure all information is accurate before institutional submission.
              </p>
            </div>
          </div>
          <ApplyStepper current={4} />
        </header>

        {error && (
          <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-lg">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-xl">
          <section className="md:col-span-8 bg-surface-container-lowest border border-outline/10 rounded-lg overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-sm text-primary">Student Bio-Data</h2>
              <button type="button" onClick={() => navigate('/apply/bio-data')} className="flex items-center gap-xs text-secondary font-label-md">
                <span className="material-symbols-outlined text-sm">edit</span> Edit
              </button>
            </div>
            <div className="p-lg grid grid-cols-1 sm:grid-cols-2 gap-lg">
              {bioFields.map(([label, value]) => (
                <div key={label} className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</label>
                  <p className="font-headline-md text-headline-sm text-on-surface">{value}</p>
                </div>
              ))}
              <div className="sm:col-span-2 space-y-xs pt-md border-t border-outline/10">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Residential Address</label>
                <p className="font-body-lg text-body-lg text-on-surface">{draft.address || '—'}</p>
              </div>
            </div>
          </section>

          <section className="md:col-span-4 bg-surface-container-lowest border border-outline/10 rounded-lg overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-sm text-primary">Guardian</h2>
              <button type="button" onClick={() => navigate('/apply/bio-data')} className="flex items-center gap-xs text-secondary font-label-md">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="p-lg space-y-lg">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">person</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Primary Guardian</p>
                  <p className="font-label-md text-label-md">{draft.guardian_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">call</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Phone Number</p>
                  <p className="font-label-md text-label-md">{draft.guardian_phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">mail</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Email Address</p>
                  <p className="font-label-md text-label-md">{draft.guardian_email || '—'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-12 bg-surface-container-lowest border border-outline/10 rounded-lg">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-sm text-primary">Documents Ready</h2>
              <button type="button" onClick={() => navigate('/apply/documents')} className="flex items-center gap-xs text-secondary font-label-md">
                <span className="material-symbols-outlined text-sm">edit</span> Edit
              </button>
            </div>
            <div className="p-lg">
              {readyDocs.length === 0 ? (
                <p className="font-label-sm text-label-sm text-on-surface-variant">No documents marked ready yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  {readyDocs.map((key) => (
                    <div key={key} className="flex items-center p-md border border-outline/10 rounded-xl">
                      <span className="material-symbols-outlined text-primary mr-md">check_circle</span>
                      <p className="font-label-md text-label-md truncate">{uploadSlots.find((s) => s.key === key)?.title || key}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="max-w-4xl mx-auto space-y-lg">
          <div className="bg-surface-container-high p-lg rounded-xl border border-primary/20">
            <div className="flex items-start gap-md">
              <input checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 w-5 h-5 rounded border-outline text-primary focus:ring-primary" id="declaration" type="checkbox" />
              <label className="font-body-md text-body-md text-on-surface" htmlFor="declaration">
                <strong>Declaration:</strong> I hereby certify that the information provided in this application is true and correct to the best of my
                knowledge. I understand that any false statements or omission of facts may be grounds for rejection of this application or subsequent
                dismissal from Mount Carmel Secondary School. I agree to abide by the rules and regulations of the institution if admitted.
              </label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-lg pt-lg">
            <button
              type="button"
              onClick={() => navigate('/apply/documents')}
              className="w-full md:w-auto px-xl py-4 border-2 border-secondary text-secondary font-headline-md rounded-lg hover:bg-secondary/10 transition-all flex items-center justify-center gap-md"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Previous Step
            </button>
            <button
              type="button"
              disabled={!declared || submitting}
              onClick={handleSubmit}
              className="w-full md:w-auto px-xl py-4 bg-primary text-on-primary font-headline-md rounded-lg shadow-lg hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-md group"
            >
              {submitting ? 'Submitting…' : 'Submit Final Application'}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
            </button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
