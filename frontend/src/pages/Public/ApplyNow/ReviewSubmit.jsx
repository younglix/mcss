import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import ApplyStepper from '../../../components/public/ApplyStepper.jsx';
import { applicantSummary } from './applyData.js';

const bioFields = [
  ['Full Legal Name', applicantSummary.fullName],
  ['Date of Birth', applicantSummary.dob],
  ['Nationality', applicantSummary.nationality],
  ['Applying For', applicantSummary.applyingFor],
];

export default function ApplyReviewSubmit() {
  const navigate = useNavigate();
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    document.title = 'Apply: Review & Submit | MCSS Portal';
  }, []);

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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-xl">
          <section className="md:col-span-8 bg-surface-container-lowest border border-outline/10 rounded-lg overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-sm text-primary">Student Bio-Data</h2>
              <button type="button" className="flex items-center gap-xs text-secondary font-label-md">
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
                <p className="font-body-lg text-body-lg text-on-surface">{applicantSummary.address}</p>
              </div>
            </div>
          </section>

          <section className="md:col-span-4 bg-surface-container-lowest border border-outline/10 rounded-lg flex flex-col items-center justify-center p-lg relative overflow-hidden">
            <div className="w-40 h-40 rounded-full border-4 border-primary p-1 mb-md flex items-center justify-center bg-surface-container-low">
              <span className="material-symbols-outlined text-outline text-5xl">person</span>
            </div>
            <div className="bg-tertiary-container text-on-tertiary-container px-md py-1 rounded-full font-label-sm text-label-sm absolute top-md right-md">
              CANDIDATE ID: {applicantSummary.candidateId}
            </div>
            <p className="font-label-md text-label-md text-primary mt-2">Official Passport Photograph</p>
          </section>

          <section className="md:col-span-4 bg-surface-container-lowest border border-outline/10 rounded-lg overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-sm text-primary">Guardian</h2>
              <button type="button" className="flex items-center gap-xs text-secondary font-label-md">
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
                  <p className="font-label-md text-label-md">{applicantSummary.guardian.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">call</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Phone Number</p>
                  <p className="font-label-md text-label-md">{applicantSummary.guardian.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">mail</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Email Address</p>
                  <p className="font-label-md text-label-md">{applicantSummary.guardian.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-8 bg-surface-container-lowest border border-outline/10 rounded-lg">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-sm text-primary">Uploaded Documents</h2>
              <button type="button" className="flex items-center gap-xs text-secondary font-label-md">
                <span className="material-symbols-outlined text-sm">add_circle</span> Add More
              </button>
            </div>
            <div className="p-lg grid grid-cols-1 sm:grid-cols-2 gap-md">
              {applicantSummary.documents.map((doc) => (
                <div key={doc.name} className="flex items-center p-md border border-outline/10 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-primary mr-md">description</span>
                  <div className="flex-grow min-w-0">
                    <p className="font-label-md text-label-md truncate">{doc.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{doc.meta}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant shrink-0">visibility</span>
                </div>
              ))}
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
              disabled={!declared}
              onClick={() => navigate('/apply/confirmation')}
              className="w-full md:w-auto px-xl py-4 bg-primary text-on-primary font-headline-md rounded-lg shadow-lg hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-md group"
            >
              Submit Final Application
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
            </button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
