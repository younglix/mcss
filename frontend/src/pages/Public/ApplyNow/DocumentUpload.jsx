import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import ApplyStepper from '../../../components/public/ApplyStepper.jsx';
import { uploadSlots } from './applyData.js';

function UploadCard({ slot, uploaded, onUpload }) {
  const isVerified = slot.status === 'verified' || uploaded;

  return (
    <div className="bg-surface-container-lowest border border-outline/10 p-lg rounded-lg">
      <div className="flex items-start justify-between gap-md mb-lg">
        <div className="flex gap-md">
          <div className={`w-12 h-12 flex items-center justify-center rounded-lg shrink-0 ${slot.tone}`}>
            <span className="material-symbols-outlined">{slot.icon}</span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-sm text-primary">{slot.title}</h3>
            <p className="text-on-surface-variant text-sm">{slot.body}</p>
          </div>
        </div>
        {isVerified && (
          <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-sm">check_circle</span> Verified
          </span>
        )}
      </div>

      {isVerified ? (
        <div className="flex flex-wrap items-center justify-between gap-md p-md bg-surface-container-low rounded-lg border border-primary/20">
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined text-primary">description</span>
            <div>
              <p className="font-label-md text-label-md text-primary">{slot.fileName || `${slot.key}.pdf`}</p>
              <p className="text-xs text-outline">{slot.fileMeta || 'Uploaded just now'}</p>
            </div>
          </div>
          <button type="button" className="text-error font-label-md hover:underline">
            Remove
          </button>
        </div>
      ) : (
        <label className="w-full border-2 border-dashed border-outline/20 rounded-lg p-xl flex flex-col items-center justify-center gap-md cursor-pointer hover:bg-surface-container-low transition-all">
          <input className="hidden" type="file" onChange={() => onUpload(slot.key)} />
          <span className="material-symbols-outlined text-outline text-5xl">cloud_upload</span>
          <p className="font-label-md text-label-md text-on-surface-variant text-center">
            Drag and drop file or <span className="text-primary underline">browse local files</span>
          </p>
          <p className="text-xs text-outline">Maximum file size: 5MB</p>
        </label>
      )}
    </div>
  );
}

export default function ApplyDocumentUpload() {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState({});

  useEffect(() => {
    document.title = 'Apply: Documents | MCSS Portal';
  }, []);

  const markUploaded = (key) => setUploaded((prev) => ({ ...prev, [key]: true }));

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <PublicHeader />
      <main className="grow max-w-container-max mx-auto px-gutter py-xl w-full">
        <header className="mb-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
            <div>
              <span className="bg-tertiary-container text-on-tertiary-container px-md py-1 rounded-full font-label-sm text-label-sm inline-block mb-sm">
                ADMISSION PHASE 2024
              </span>
              <h1 className="font-headline-xl text-headline-lg text-primary mt-1">Application Documents</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-md">
                Step 3 of 4: Please upload the required legal and academic documentation to proceed with your application. Files must be in PDF, JPG, or PNG format.
              </p>
            </div>
          </div>
          <ApplyStepper current={3} />
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className="lg:col-span-8 space-y-lg">
            {uploadSlots.map((slot) => (
              <UploadCard key={slot.key} slot={slot} uploaded={uploaded[slot.key]} onUpload={markUploaded} />
            ))}
          </div>

          <div className="lg:col-span-4 space-y-lg">
            <div className="bg-primary text-on-primary p-lg rounded-lg shadow-sm">
              <div className="flex items-center gap-md mb-lg">
                <div className="w-16 h-16 bg-on-primary/10 rounded-full flex items-center justify-center border border-on-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-4xl">school</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm uppercase opacity-80">Mount Carmel</p>
                  <h4 className="font-headline-md text-headline-sm">Admissions Board</h4>
                </div>
              </div>
              <p className="font-body-md text-body-md opacity-90 leading-relaxed italic">
                &ldquo;Tradition in Excellence, Innovation in Learning. Our admission process ensures we uphold the highest standards of our academic
                heritage.&rdquo;
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline/10 rounded-lg p-lg">
              <h4 className="font-label-md text-label-md text-primary mb-md">Guidance: Photo Standards</h4>
              <div className="space-y-md">
                <div className="flex items-start gap-md">
                  <div className="w-20 h-20 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-outline text-3xl">portrait</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-on-surface font-bold">✓ Neutral Expression</p>
                    <p className="text-xs text-on-surface font-bold">✓ High Resolution</p>
                    <p className="text-xs text-on-surface font-bold">✓ White Background</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">Ensure documents are scanned clearly. Blurry or cut-off images may delay the verification of your application.</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline/10 p-lg rounded-lg">
              <h4 className="font-label-md text-label-md text-primary mb-md">Need Assistance?</h4>
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-secondary">support_agent</span>
                <span className="font-body-md text-body-md">0800-CARMEL-ADM</span>
              </div>
              <button type="button" className="w-full py-3 border border-secondary text-secondary rounded-lg font-label-md hover:bg-secondary/5 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-xl pt-lg border-t border-outline/10 flex flex-col md:flex-row justify-between items-center gap-lg">
          <button type="button" onClick={() => navigate('/apply/bio-data')} className="flex items-center gap-xs font-label-md text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            Return to Step 2
          </button>
          <div className="flex gap-md">
            <button type="button" className="px-xl py-3 text-secondary font-label-md hover:bg-secondary/5 rounded-lg transition-colors">
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => navigate('/apply/review')}
              className="px-xl py-3 bg-primary text-on-primary rounded-lg font-label-md shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Submit &amp; Continue
            </button>
          </div>
        </footer>
      </main>
      <PublicFooter />
    </div>
  );
}
