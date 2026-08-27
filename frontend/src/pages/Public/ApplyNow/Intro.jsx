import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import ApplyStepper from '../../../components/public/ApplyStepper.jsx';
import { sessions, levels, processSteps, requiredDocs } from './applyData.js';
import { saveDraft, getDraft } from './applyDraft.js';

export default function ApplyIntro() {
  const navigate = useNavigate();
  const [session, setSession] = useState(sessions[0].key);
  const [level, setLevel] = useState(getDraft().level || levels[0].key);
  const [agreed, setAgreed] = useState(false);

  const handleStart = () => {
    saveDraft({ level });
    navigate('/apply/bio-data');
  };

  useEffect(() => {
    document.title = 'Apply | MCSS Portal';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <PublicHeader />
      <main className="grow">
        <section className="relative w-full h-100 flex items-center justify-center overflow-hidden bg-nav">
          <div className="absolute inset-0 bg-nav/70" />
          <div className="relative z-10 text-center max-w-3xl px-gutter">
            <h1 className="font-headline-xl text-headline-lg text-on-nav mb-md">Forge Your Future at Mount Carmel</h1>
            <p className="font-body-lg text-body-lg text-on-nav/90">
              Join a legacy of excellence, integrity, and academic mastery. Your journey to leadership begins with a single application.
            </p>
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-gutter -mt-16 relative z-30 pb-xl">
          <div className="bg-surface-container-lowest shadow-lg rounded-lg p-lg md:p-16 flex flex-col items-center border border-outline/10">
            <div className="w-full mb-xl">
              <ApplyStepper current={1} />
            </div>

            <div className="max-w-4xl w-full">
              <header className="text-center mb-xl">
                <h2 className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-xs">Step 01: Getting Started</h2>
                <h3 className="font-headline-lg text-headline-md text-primary">Admission Application Process</h3>
                <p className="mt-md font-body-md text-on-surface-variant max-w-2xl mx-auto">
                  Welcome to the Mount Carmel Secondary School online application portal. Please read the following instructions carefully before commencing your
                  application for the upcoming academic session.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
                {processSteps.map((step) => (
                  <div key={step.title} className="p-lg bg-surface-container-low rounded-lg border border-outline/10 text-center">
                    <span className="material-symbols-outlined text-primary text-3xl mb-sm">{step.icon}</span>
                    <h4 className="font-label-md text-label-md text-primary mb-xs">{step.title}</h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline/10 max-w-2xl mx-auto">
                <div className="space-y-lg">
                  <div>
                    <label className="font-label-md text-label-md text-primary block mb-sm">Applying For</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {levels.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setLevel(option.key)}
                          className={`relative p-md rounded-lg text-left transition-all border-2 ${
                            level === option.key ? 'border-primary bg-primary/5' : 'border-outline/20 hover:border-primary'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-label-md text-label-md text-on-surface">{option.label}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">{option.note}</p>
                            </div>
                            {level === option.key && <span className="material-symbols-outlined text-primary">check_circle</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-label-md text-label-md text-primary block mb-sm">Select Intended Academic Session</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {sessions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSession(option.key)}
                          className={`relative p-md rounded-lg text-left transition-all border-2 ${
                            session === option.key ? 'border-primary bg-primary/5' : 'border-outline/20 hover:border-primary'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-label-md text-label-md text-on-surface">{option.label}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">{option.note}</p>
                            </div>
                            {session === option.key && <span className="material-symbols-outlined text-primary">check_circle</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-md">
                    <label className="flex items-start gap-md cursor-pointer group">
                      <input checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 rounded border-outline text-primary focus:ring-primary" type="checkbox" />
                      <span className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
                        I certify that I am the legal guardian or applicant and I have read the{' '}
                        <a className="text-secondary font-bold hover:underline" href="#">
                          Admission Guidelines
                        </a>{' '}
                        and{' '}
                        <a className="text-secondary font-bold hover:underline" href="#">
                          Privacy Policy
                        </a>{' '}
                        of Mount Carmel Secondary School.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-xl flex flex-col items-center gap-md">
                <button
                  type="button"
                  disabled={!agreed}
                  onClick={handleStart}
                  className="px-xl py-lg bg-primary text-on-primary rounded-lg font-headline-md text-headline-sm hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none shadow-lg hover:-translate-y-1 transition-all flex items-center gap-sm"
                >
                  Start Application
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="font-label-sm text-label-sm text-outline">Average completion time: 15-20 minutes</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-gutter pb-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
            <div className="bg-surface-container-low p-xl rounded-lg h-full border border-outline/10">
              <h4 className="font-headline-md text-headline-md text-primary mb-md">Required Documentation</h4>
              <ul className="space-y-md">
                {requiredDocs.map((doc) => (
                  <li key={doc} className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-secondary">verified</span>
                    <span className="font-body-md text-body-md">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-container-low rounded-lg h-85 flex items-center justify-center border border-outline/10">
              <div className="text-center px-lg">
                <span className="material-symbols-outlined text-primary text-5xl">support_agent</span>
                <p className="font-label-md text-label-md text-primary mt-md">Technical Assistance Available 24/7</p>
                <Link to="/login" className="text-secondary font-label-sm hover:underline mt-xs inline-block">
                  Portal access issues? Contact support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
