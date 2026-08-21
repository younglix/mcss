import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import ApplyStepper from '../../../components/public/ApplyStepper.jsx';
import { entryLevels } from './applyData.js';

const inputClasses = 'mcss-field w-full px-md';

export default function ApplyBioData() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Apply: Bio-Data | MCSS Portal';
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <div className="bg-surface-container-low p-lg border-b border-outline/10 flex flex-col sm:flex-row justify-between sm:items-center gap-sm">
            <div>
              <h1 className="font-headline-lg text-headline-md text-primary">Applicant Bio-Data</h1>
              <p className="font-body-md text-on-surface-variant">Please provide accurate personal and contact information for the student.</p>
            </div>
            <div className="bg-tertiary-container text-on-tertiary-container px-lg py-2 font-label-md rounded-full self-start">2024/25 ADMISSIONS</div>
          </div>

          <form className="p-lg space-y-xl" onSubmit={handleSubmit}>
            <div className="space-y-lg">
              <div className="flex items-center gap-sm border-b border-outline/10 pb-xs">
                <span className="material-symbols-outlined text-secondary">badge</span>
                <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider">Student Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="md:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="full_name">
                    Full Name (As it appears on birth certificate)
                  </label>
                  <input className={inputClasses} id="full_name" placeholder="Johnathan Doe" type="text" />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="dob">
                    Date of Birth
                  </label>
                  <input className={inputClasses} id="dob" type="date" />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="gender">
                    Gender
                  </label>
                  <select className={inputClasses} id="gender" defaultValue="">
                    <option disabled value="">
                      Select Gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="entry_level">
                    Intended Class/Entry Level
                  </label>
                  <select className={inputClasses} id="entry_level" defaultValue="">
                    <option disabled value="">
                      Select Class
                    </option>
                    {entryLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="prev_school">
                    Previous School Attended
                  </label>
                  <input className={inputClasses} id="prev_school" placeholder="International Primary Academy" type="text" />
                </div>
              </div>
            </div>

            <div className="space-y-lg">
              <div className="flex items-center gap-sm border-b border-outline/10 pb-xs">
                <span className="material-symbols-outlined text-secondary">family_restroom</span>
                <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider">Guardian/Parent Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="md:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="guardian_name">
                    Guardian Full Name
                  </label>
                  <input className={inputClasses} id="guardian_name" placeholder="Sarah Jane Doe" type="text" />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="guardian_phone">
                    Phone Number
                  </label>
                  <input className={inputClasses} id="guardian_phone" placeholder="+1 (555) 000-0000" type="tel" />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="guardian_email">
                    Email Address
                  </label>
                  <input className={inputClasses} id="guardian_email" placeholder="sarah.doe@example.com" type="email" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs" htmlFor="address">
                    Residential Address
                  </label>
                  <textarea className={`${inputClasses} resize-none`} id="address" placeholder="123 Carmel Avenue, Heritage District..." rows={3} />
                </div>
              </div>
            </div>

            <div className="pt-xl flex flex-col md:flex-row justify-between items-center gap-md border-t border-outline/10">
              <button
                type="button"
                onClick={() => navigate('/apply')}
                className="px-xl py-3 border-2 border-secondary text-secondary rounded-full font-label-md hover:bg-secondary/5 transition-all w-full md:w-auto"
              >
                Previous Step
              </button>
              <div className="flex flex-col md:flex-row gap-md w-full md:w-auto">
                <button type="button" className="px-xl py-3 text-secondary font-label-md hover:underline transition-all">
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="px-xl py-3 bg-primary text-on-primary rounded-full font-label-md shadow-lg hover:opacity-90 transition-all active:scale-95 w-full md:w-auto"
                >
                  Continue to Academic Records
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="p-lg bg-tertiary-container text-on-tertiary-container rounded-lg flex gap-md items-start">
            <span className="material-symbols-outlined mt-1">info</span>
            <div>
              <h4 className="font-label-md text-label-md mb-xs">Academic Integrity</h4>
              <p className="text-sm">Please ensure all details match official government documents. Inconsistencies may delay the processing of your application.</p>
            </div>
          </div>
          <div className="p-lg bg-secondary-container text-on-secondary-container rounded-lg flex gap-md items-start">
            <span className="material-symbols-outlined mt-1">help</span>
            <div>
              <h4 className="font-label-md text-label-md mb-xs">Need Assistance?</h4>
              <p className="text-sm">
                Our admissions office is available Monday-Friday, 8am-4pm. Contact us at <span className="font-bold">admissions@mtcarmel.edu</span>
              </p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
