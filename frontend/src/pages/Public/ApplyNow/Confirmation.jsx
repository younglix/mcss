import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import { referenceNumber, nextSteps } from './applyData.js';

export default function ApplyConfirmation() {
  useEffect(() => {
    document.title = 'Application Received | MCSS Portal';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <main className="grow flex flex-col items-center justify-center relative overflow-hidden px-gutter py-xl">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary opacity-[0.03] rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-128 h-128 bg-secondary opacity-[0.05] rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-200 z-10 flex flex-col items-center">
          <div className="mb-lg">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-on-primary shadow-lg ring-8 ring-primary/10">
              <span className="material-symbols-outlined text-5xl">verified</span>
            </div>
          </div>

          <div className="text-center mb-xl">
            <h1 className="font-headline-xl text-headline-lg text-primary mb-sm">Application Received</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Welcome to the Mount Carmel family. Your application for the 2024 Academic Year has been successfully submitted and is now under formal
              review by our admissions committee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg w-full mb-xl">
            <div className="md:col-span-7 bg-surface-container-lowest border border-outline/10 p-xl rounded-lg shadow-sm flex flex-col justify-center relative overflow-hidden">
              <span className="material-symbols-outlined absolute top-0 right-0 p-md opacity-10 text-8xl">assignment_turned_in</span>
              <span className="font-label-md text-label-md text-secondary mb-xs">REFERENCE NUMBER</span>
              <h2 className="font-headline-lg text-headline-md text-primary tracking-widest uppercase">{referenceNumber}</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">Keep this number for all future correspondence with the Admissions Office.</p>
            </div>
            <button
              type="button"
              className="md:col-span-5 group bg-primary text-on-primary p-xl rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition-all hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-4xl mb-sm group-hover:scale-110 transition-transform">picture_as_pdf</span>
              <span className="font-headline-md text-headline-sm">Download Summary</span>
              <p className="font-label-sm text-label-sm opacity-80 mt-xs">PDF Document • 2.4 MB</p>
            </button>

            <div className="md:col-span-12 bg-surface-container-low border border-outline/10 rounded-lg overflow-hidden">
              <div className="bg-primary px-lg py-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-primary">info</span>
                <h3 className="font-headline-md text-headline-sm text-on-primary">What Happens Next</h3>
              </div>
              <div className="p-xl grid grid-cols-1 md:grid-cols-3 gap-lg">
                {nextSteps.map((step, i) => (
                  <div key={step.title} className={`flex flex-col ${step.status === 'pending' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-sm mb-sm">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-label-md ${step.status === 'current' ? 'bg-secondary text-on-secondary' : 'bg-outline text-surface'}`}>
                        {i + 1}
                      </span>
                      {step.status === 'current' && (
                        <span className="bg-secondary-container text-on-secondary-container px-sm py-0.5 rounded-full font-label-sm text-[10px] uppercase font-bold">Current</span>
                      )}
                    </div>
                    <h4 className="font-label-md text-label-md text-primary mb-xs">{step.title}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-md w-full justify-center">
            <Link
              to="/apply/status"
              className="w-full md:w-auto px-xl py-md bg-primary text-on-primary rounded-lg font-headline-md text-headline-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined">analytics</span>
              Check Application Status
            </Link>
            <Link
              to="/"
              className="w-full md:w-auto px-xl py-md border-2 border-secondary text-secondary rounded-lg font-headline-md text-headline-sm hover:bg-secondary/5 transition-all flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined">home</span>
              Return to Homepage
            </Link>
          </div>

          <div className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant italic">
              A confirmation email has been sent to the primary guardian&apos;s address.
              <br />
              Need assistance? Contact us at <span className="text-primary font-bold not-italic">admissions@mountcarmel.edu</span>
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
