import { useEffect, useState } from 'react';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import { statusResult } from './applyData.js';

const timelineTone = {
  done: { dot: 'bg-secondary text-on-secondary', icon: 'check' },
  active: { dot: 'bg-primary text-on-primary animate-pulse', icon: 'sync' },
  pending: { dot: 'bg-surface-container text-outline', icon: 'event' },
};

export default function ApplyStatusCheck() {
  const [showResult, setShowResult] = useState(true);

  useEffect(() => {
    document.title = 'Application Status | MCSS Portal';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <PublicHeader />
      <main className="grow">
        <section className="relative py-xl px-gutter overflow-hidden bg-nav text-on-nav">
          <div className="max-w-container-max mx-auto relative z-10 flex flex-col items-center text-center">
            <h1 className="font-headline-xl text-headline-lg mb-md">Application Status</h1>
            <p className="font-body-lg text-body-lg max-w-2xl opacity-90 mb-xl">
              Track your journey to academic excellence. Enter your reference number or registered email to view your current status and next steps.
            </p>
            <form
              className="w-full max-w-xl bg-surface-container-lowest p-lg rounded-lg shadow-sm text-on-surface flex flex-col md:flex-row gap-md items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setShowResult(true);
              }}
            >
              <div className="flex-grow text-left w-full">
                <label className="font-label-md text-label-md text-outline block mb-xs" htmlFor="ref-input">
                  Reference Number or Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
                  <input
                    className="w-full pl-xl pr-md py-md rounded-md border border-outline/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md"
                    id="ref-input"
                    placeholder="MCSS-2024-XXXX"
                    type="text"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto bg-primary text-on-primary font-headline-md text-headline-sm px-xl py-md rounded-md hover:opacity-90 transition-all flex items-center justify-center gap-sm"
              >
                <span>Check Status</span>
              </button>
            </form>
          </div>
        </section>

        {showResult && (
          <section className="py-xl px-gutter max-w-container-max mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
              <div className="lg:col-span-5 space-y-lg">
                <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline/10 shadow-sm">
                  <div className="flex justify-between items-start mb-lg gap-md">
                    <div>
                      <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Applicant Name</p>
                      <h3 className="font-headline-md text-headline-sm text-primary">{statusResult.name}</h3>
                    </div>
                    <div className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-full font-label-md text-label-md font-bold uppercase shrink-0">
                      {statusResult.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-lg border-t border-outline/10 pt-lg">
                    <div>
                      <p className="font-label-sm text-label-sm text-outline mb-xs">Ref ID</p>
                      <p className="font-body-md text-body-md font-bold text-on-surface">{statusResult.refId}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-outline mb-xs">Grade Level</p>
                      <p className="font-body-md text-body-md font-bold text-on-surface">{statusResult.gradeLevel}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-outline mb-xs">Term</p>
                      <p className="font-body-md text-body-md font-bold text-on-surface">{statusResult.term}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-outline mb-xs">Submission Date</p>
                      <p className="font-body-md text-body-md font-bold text-on-surface">{statusResult.submissionDate}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-lg rounded-lg border-l-4 border-secondary flex gap-md items-start">
                  <span className="material-symbols-outlined text-secondary">info</span>
                  <div>
                    <h4 className="font-label-md text-label-md font-bold text-on-surface">Action Required</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">{statusResult.actionRequired}</p>
                    <button type="button" className="mt-md text-secondary font-label-md text-label-md underline hover:text-primary transition-colors">
                      Upload Document
                    </button>
                  </div>
                </div>

                <div className="relative h-64 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                  <div className="text-center px-lg">
                    <span className="material-symbols-outlined text-primary text-5xl">domain</span>
                    <p className="font-label-md text-label-md text-primary mt-sm">Mount Carmel Main Campus — North Wing</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline/10 shadow-sm h-full">
                  <h3 className="font-headline-md text-headline-sm text-primary mb-xl">Application Progress</h3>
                  <div className="relative pl-xl">
                    <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-outline/10" />
                    {statusResult.timeline.map((step, i) => (
                      <div key={step.title} className={`relative ${i < statusResult.timeline.length - 1 ? 'mb-xl' : ''} ${step.state === 'pending' ? 'opacity-50' : ''}`}>
                        <div
                          className={`absolute -left-7.5 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-surface-container-lowest ${timelineTone[step.state].dot}`}
                        >
                          <span className="material-symbols-outlined text-sm">{timelineTone[step.state].icon}</span>
                        </div>
                        <div className="pl-md">
                          <h4 className={`font-label-md text-label-md font-bold ${step.state === 'active' ? 'text-primary' : 'text-on-surface'}`}>{step.title}</h4>
                          <p className="font-body-md text-body-md text-on-surface-variant">{step.meta}</p>
                          {step.body && <p className="font-body-md text-body-md text-outline mt-xs">{step.body}</p>}
                          {step.progress != null && (
                            <div className="mt-md bg-surface-container h-2 rounded-full overflow-hidden w-64 max-w-full">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${step.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-xl pt-lg border-t border-outline/10 flex flex-wrap justify-end gap-md">
                    <button type="button" className="bg-surface-container text-on-surface font-label-md text-label-md px-lg py-md rounded-md hover:bg-surface-container-high transition-all">
                      Print Summary
                    </button>
                    <button type="button" className="bg-secondary text-on-secondary font-label-md text-label-md px-lg py-md rounded-md hover:opacity-90 transition-all">
                      Contact Admissions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
