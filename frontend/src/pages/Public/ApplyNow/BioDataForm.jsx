import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import ApplyStepper from '../../../components/public/ApplyStepper.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import { api } from '../../../lib/api.js';
import { getDraft, saveDraft } from './applyDraft.js';

const emptyBioData = {
  level: 'secondary',
  surname: '', first_name: '', middle_name: '', date_of_birth: '', gender: '',
  present_class: '', schools_attended: '', religion: '', religion_other: '',
  nationality: '', state_of_origin: '', class_applying_for: '', previous_school: '',
  email: '', phone: '', address: '',
  has_guardian: true, guardian_name: '', guardian_phone: '', guardian_email: '',
  father_name: '', father_occupation: '', father_phone: '', father_place_of_work: '',
  father_home_address: '', father_office_address: '', father_email: '',
  mother_name: '', mother_occupation: '', mother_phone: '', mother_place_of_work: '',
  mother_home_address: '', mother_office_address: '', mother_email: '',
  siblings_in_school: '', guardian_signature_name: '',
};

const GENDER_OPTIONS = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }];
const RELIGION_OPTIONS = [
  { value: 'christianity', label: 'Christianity' }, { value: 'islam', label: 'Islam' }, { value: 'others', label: 'Others' },
];

export default function ApplyBioData() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ ...emptyBioData, ...getDraft() });
  const [classOptions, setClassOptions] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState(getDraft().customFieldValues || {});
  const [error, setError] = useState('');

  const isSecondary = values.level === 'secondary';

  useEffect(() => {
    document.title = 'Apply: Bio-Data | MCSS Portal';
    api.get('/config/public-classes', { auth: false }).then(setClassOptions).catch(() => {});
    api.get('/custom-fields/values?entity=application', { auth: false }).then(setCustomFields).catch(() => setCustomFields([]));
  }, []);

  const set = (key) => (v) => setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.surname || !values.first_name) {
      setError('Surname and first name are required.');
      return;
    }
    if (!values.email && !values.phone) {
      setError('Provide at least an email or phone number so we can reach you.');
      return;
    }
    if (isSecondary) {
      const required = [
        'date_of_birth', 'gender', 'present_class', 'schools_attended', 'religion', 'nationality',
        'state_of_origin', 'address', 'father_name', 'father_phone', 'mother_name', 'mother_phone',
        'guardian_signature_name', 'class_applying_for',
      ];
      const missing = required.filter((k) => !values[k]);
      if (values.religion === 'others' && !values.religion_other) missing.push('religion_other');
      if (values.has_guardian && !values.guardian_name) missing.push('guardian_name');
      if (values.has_guardian && !values.guardian_phone && !values.guardian_email) missing.push('guardian_phone_or_email');
      if (missing.length > 0) {
        setError(`Please complete all required fields before continuing (${missing.length} remaining).`);
        return;
      }
    }
    saveDraft({ ...values, customFieldValues });
    navigate('/apply/documents');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <PublicHeader />
      <main className="grow w-full max-w-container-max mx-auto px-gutter py-xl">
        <div className="mb-xl">
          <ApplyStepper current={2} />
        </div>

        <div className="bg-surface-container-lowest rounded-lg border border-outline/10 shadow-sm overflow-hidden">
          <div className="bg-surface-container-low p-lg border-b border-outline/10">
            <h1 className="font-headline-lg text-headline-md text-primary">Applicant Bio-Data</h1>
            <p className="font-body-md text-on-surface-variant">
              {isSecondary
                ? 'Please provide accurate information exactly as it appears on official documents — every field below is required.'
                : 'Please provide accurate personal and contact information for the student.'}
            </p>
          </div>

          <form className="p-lg space-y-xl" onSubmit={handleSubmit}>
            {/* 1. Candidate */}
            <section className="space-y-lg">
              <SectionHeading icon="badge" title="Candidate Information" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <FormField field={{ key: 'surname', label: 'Surname', type: 'text', required: true }} value={values.surname} onChange={set('surname')} />
                <FormField field={{ key: 'first_name', label: 'First Name', type: 'text', required: true }} value={values.first_name} onChange={set('first_name')} />
                <FormField field={{ key: 'middle_name', label: 'Middle Name', type: 'text' }} value={values.middle_name} onChange={set('middle_name')} />
                <FormField field={{ key: 'date_of_birth', label: 'Date of Birth', type: 'date', required: isSecondary }} value={values.date_of_birth} onChange={set('date_of_birth')} />
                <FormField field={{ key: 'gender', label: 'Gender', type: 'select', required: isSecondary, options: GENDER_OPTIONS }} value={values.gender} onChange={set('gender')} />
                <FormField
                  field={{ key: 'class_applying_for', label: 'Class Applying For', type: 'select', required: isSecondary, options: classOptions.map((c) => ({ value: c.id, label: c.name })) }}
                  value={values.class_applying_for} onChange={set('class_applying_for')}
                />
                <FormField field={{ key: 'present_class', label: 'Present Class (at current school)', type: 'text', required: isSecondary }} value={values.present_class} onChange={set('present_class')} />
                <div className="md:col-span-2">
                  <FormField field={{ key: 'schools_attended', label: 'School(s) Attended', type: 'text', required: isSecondary, placeholder: 'e.g. Sunrise Primary School' }} value={values.schools_attended} onChange={set('schools_attended')} />
                </div>
                <FormField field={{ key: 'religion', label: 'Religion', type: 'select', required: isSecondary, options: RELIGION_OPTIONS }} value={values.religion} onChange={set('religion')} />
                {values.religion === 'others' && (
                  <FormField field={{ key: 'religion_other', label: 'Please Specify', type: 'text', required: isSecondary }} value={values.religion_other} onChange={set('religion_other')} />
                )}
                <FormField field={{ key: 'nationality', label: 'Nationality', type: 'text', required: isSecondary }} value={values.nationality} onChange={set('nationality')} />
                <FormField field={{ key: 'state_of_origin', label: 'State of Origin', type: 'text', required: isSecondary }} value={values.state_of_origin} onChange={set('state_of_origin')} />
              </div>
            </section>

            {/* 2. Contact & Address */}
            <section className="space-y-lg">
              <SectionHeading icon="contact_mail" title="Contact & Address" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <FormField field={{ key: 'email', label: 'Email', type: 'text', placeholder: 'Optional if phone is set' }} value={values.email} onChange={set('email')} />
                <FormField field={{ key: 'phone', label: 'Phone', type: 'text' }} value={values.phone} onChange={set('phone')} />
                <div className="md:col-span-2">
                  <FormField field={{ key: 'address', label: "Child's/Ward's Address (if different from parents')", type: 'textarea', rows: 2, required: isSecondary }} value={values.address} onChange={set('address')} />
                </div>
              </div>
            </section>

            {/* 3. Guardian */}
            <section className="space-y-lg">
              <SectionHeading icon="family_restroom" title="Guardian" />
              <FormField field={{ key: 'has_guardian', label: 'This applicant has a parent/guardian', type: 'checkbox' }} value={values.has_guardian} onChange={set('has_guardian')} />
              {values.has_guardian && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div className="md:col-span-2">
                    <FormField field={{ key: 'guardian_name', label: 'Guardian Full Name', type: 'text', required: isSecondary }} value={values.guardian_name} onChange={set('guardian_name')} />
                  </div>
                  <FormField field={{ key: 'guardian_phone', label: 'Guardian Phone', type: 'text' }} value={values.guardian_phone} onChange={set('guardian_phone')} />
                  <FormField field={{ key: 'guardian_email', label: 'Guardian Email', type: 'text' }} value={values.guardian_email} onChange={set('guardian_email')} />
                </div>
              )}
            </section>

            {/* 4. Father */}
            <section className="space-y-lg">
              <SectionHeading icon="man" title="Father's Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <FormField field={{ key: 'father_name', label: 'Name', type: 'text', required: isSecondary }} value={values.father_name} onChange={set('father_name')} />
                <FormField field={{ key: 'father_occupation', label: 'Occupation', type: 'text' }} value={values.father_occupation} onChange={set('father_occupation')} />
                <FormField field={{ key: 'father_phone', label: 'Telephone No.', type: 'text', required: isSecondary }} value={values.father_phone} onChange={set('father_phone')} />
                <FormField field={{ key: 'father_place_of_work', label: 'Place of Work', type: 'text' }} value={values.father_place_of_work} onChange={set('father_place_of_work')} />
                <FormField field={{ key: 'father_email', label: 'Email Address', type: 'text' }} value={values.father_email} onChange={set('father_email')} />
                <FormField field={{ key: 'father_home_address', label: 'Home Address', type: 'textarea', rows: 2 }} value={values.father_home_address} onChange={set('father_home_address')} />
                <FormField field={{ key: 'father_office_address', label: 'Office Address', type: 'textarea', rows: 2 }} value={values.father_office_address} onChange={set('father_office_address')} />
              </div>
            </section>

            {/* 5. Mother */}
            <section className="space-y-lg">
              <SectionHeading icon="woman" title="Mother's Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <FormField field={{ key: 'mother_name', label: 'Name', type: 'text', required: isSecondary }} value={values.mother_name} onChange={set('mother_name')} />
                <FormField field={{ key: 'mother_occupation', label: 'Occupation', type: 'text' }} value={values.mother_occupation} onChange={set('mother_occupation')} />
                <FormField field={{ key: 'mother_phone', label: 'Telephone No.', type: 'text', required: isSecondary }} value={values.mother_phone} onChange={set('mother_phone')} />
                <FormField field={{ key: 'mother_place_of_work', label: 'Place of Work', type: 'text' }} value={values.mother_place_of_work} onChange={set('mother_place_of_work')} />
                <FormField field={{ key: 'mother_email', label: 'Email Address', type: 'text' }} value={values.mother_email} onChange={set('mother_email')} />
                <FormField field={{ key: 'mother_home_address', label: 'Home Address', type: 'textarea', rows: 2 }} value={values.mother_home_address} onChange={set('mother_home_address')} />
                <FormField field={{ key: 'mother_office_address', label: 'Office Address', type: 'textarea', rows: 2 }} value={values.mother_office_address} onChange={set('mother_office_address')} />
              </div>
            </section>

            {/* 6. Additional */}
            <section className="space-y-lg">
              <SectionHeading icon="groups" title="Additional Information" />
              <div className="grid grid-cols-1 gap-lg">
                <FormField field={{ key: 'siblings_in_school', label: 'Any sibling(s)/relative(s) already at Mount Carmel School?', type: 'text', placeholder: 'Name(s), or leave blank if none' }} value={values.siblings_in_school} onChange={set('siblings_in_school')} />
                {customFields.length > 0 && customFields.map((f) => (
                  <FormField
                    key={f.field_id}
                    field={{ key: f.field_id, label: f.label, type: f.field_type, required: f.required, options: (f.options || []).map((o) => ({ value: o, label: o })) }}
                    value={customFieldValues[f.field_id] ?? ''}
                    onChange={(v) => setCustomFieldValues((prev) => ({ ...prev, [f.field_id]: v }))}
                  />
                ))}
              </div>
            </section>

            {/* 7. Certification */}
            <section className="space-y-lg">
              <SectionHeading icon="draw" title="Certification" />
              <FormField
                field={{ key: 'guardian_signature_name', label: 'Type the full name of the parent/guardian certifying this application', type: 'text', required: isSecondary }}
                value={values.guardian_signature_name} onChange={set('guardian_signature_name')}
              />
            </section>

            {error && <p className="font-label-md text-label-md text-error">{error}</p>}

            <div className="pt-xl flex flex-col md:flex-row justify-between items-center gap-md border-t border-outline/10">
              <button
                type="button"
                onClick={() => navigate('/apply')}
                className="px-xl py-3 border-2 border-secondary text-secondary rounded-full font-label-md hover:bg-secondary/5 transition-all w-full md:w-auto"
              >
                Previous Step
              </button>
              <button
                type="submit"
                className="px-xl py-3 bg-primary text-on-primary rounded-full font-label-md shadow-lg hover:opacity-90 transition-all active:scale-95 w-full md:w-auto"
              >
                Continue to Documents
              </button>
            </div>
          </form>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function SectionHeading({ icon, title }) {
  return (
    <div className="flex items-center gap-sm border-b border-outline/10 pb-xs">
      <span className="material-symbols-outlined text-secondary">{icon}</span>
      <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider">{title}</h3>
    </div>
  );
}
