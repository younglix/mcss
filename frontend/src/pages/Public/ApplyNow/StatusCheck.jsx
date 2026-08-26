import { useEffect, useState } from 'react';
import PublicHeader from '../../../components/public/PublicHeader.jsx';
import PublicFooter from '../../../components/public/PublicFooter.jsx';
import { api, ApiError } from '../../../lib/api.js';

const STATUS_LABEL = {
  submitted: 'Submitted', under_review: 'Under Review', accepted: 'Accepted', rejected: 'Not Successful',
};

export default function ApplyStatusCheck() {
  const [reference, setReference] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Application Status | MCSS Portal';
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.get(`/admissions/status/${encodeURIComponent(reference.trim())}`, { auth: false });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? "We couldn't find an application with that reference number." : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              onSubmit={handleSearch}
            >
              <div className="flex-grow text-left w-full">
                <label className="font-label-md text-label-md text-outline block mb-xs" htmlFor="ref-input">
                  Reference Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
                  <input
                    className="mcss-field w-full pl-xl pr-md"
                    id="ref-input"
                    placeholder="APP/2026/00001"
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-primary text-on-primary font-headline-md text-headline-sm px-xl py-md rounded-md hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-sm"
              >
                <span>{loading ? 'Searching…' : 'Check Status'}</span>
              </button>
            </form>
            {error && <p className="mt-md font-label-md text-label-md text-error bg-error-container/80 px-md py-sm rounded-lg">{error}</p>}
          </div>
        </section>

        {result && (
          <section className="py-xl px-gutter max-w-container-max mx-auto">
            <div className="max-w-2xl mx-auto bg-surface-container-lowest p-xl rounded-lg border border-outline/10 shadow-sm">
              <div className="flex justify-between items-start mb-lg gap-md">
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Applicant Name</p>
                  <h3 className="font-headline-md text-headline-sm text-primary">{result.full_name}</h3>
                </div>
                <div className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-full font-label-md text-label-md font-bold uppercase shrink-0">
                  {STATUS_LABEL[result.status] || result.status}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-lg border-t border-outline/10 pt-lg">
                <div>
                  <p className="font-label-sm text-label-sm text-outline mb-xs">Reference Number</p>
                  <p className="font-body-md text-body-md font-bold text-on-surface">{result.reference_number}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline mb-xs">Applying For</p>
                  <p className="font-body-md text-body-md font-bold text-on-surface">{result.class_applying_for_name || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-label-sm text-label-sm text-outline mb-xs">Submitted</p>
                  <p className="font-body-md text-body-md font-bold text-on-surface">{new Date(result.submitted_at).toLocaleDateString()}</p>
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
