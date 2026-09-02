import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext.jsx';
import { examApi, ExamApiError, setExamSession } from '../../lib/examApi.js';

const inputClasses = 'mcss-field w-full pl-11 pr-md hover:border-primary';

/** Standalone, public — reached by a student typing a URL into an exam-hall
 * computer, not through the normal portal login. Student ID + the exam's
 * live access code only; nothing here touches a student's real password. */
export default function ExamAccessLogin() {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [studentId, setStudentId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canSubmit = studentId.trim().length > 0 && accessCode.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setFormError('');
    setSubmitting(true);
    try {
      const result = await examApi.post('/exam/access/login', {
        student_id: studentId.trim(),
        access_code: accessCode.trim(),
      }, { auth: false });
      setExamSession(result.access_token, {
        studentName: result.student_name,
        examTitle: result.exam.title,
        durationMinutes: result.exam.duration_minutes,
      });
      navigate(`/exam/${result.exam.id}/take`);
    } catch (err) {
      setFormError(err instanceof ExamApiError ? err.message : 'Unable to log in. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface-container-lowest p-lg">
      <div className="max-w-md w-full flex flex-col gap-xl">
        <header className="flex flex-col items-center gap-sm text-center animate-fade-slide-in">
          <div className="w-16 h-16 flex items-center justify-center bg-surface-container-lowest rounded-lg shadow-md p-sm">
            {branding.logo ? (
              <img src={branding.logo} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="material-symbols-outlined text-primary text-3xl">laptop_chromebook</span>
            )}
          </div>
          <h1 className="font-headline-lg text-headline-md text-on-surface">{branding.short_name || branding.name || 'CBE Exam Access'}</h1>
          <p className="font-body-md text-on-surface-variant">
            Enter your Student ID and the access code your invigilator gave you to start this exam.
          </p>
        </header>

        <form className="flex flex-col gap-lg bg-surface-container-lowest border border-outline/10 rounded-xl shadow-sm p-xl" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant" htmlFor="studentId">Student ID</label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">badge</span>
              <input
                className={inputClasses}
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. MC/2026/0001"
                type="text"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant" htmlFor="accessCode">Access Code</label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">key</span>
              <input
                className={`${inputClasses} tracking-[0.3em] uppercase`}
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. 4F2A9C1B"
                type="text"
              />
            </div>
          </div>

          {formError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="bg-secondary text-on-secondary font-label-md font-bold py-md rounded shadow-sm hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98] flex items-center justify-center gap-sm"
          >
            {submitting ? 'Checking…' : 'Continue to Exam'}
            {!submitting && <span className="material-symbols-outlined text-body-md">arrow_forward</span>}
          </button>
        </form>

        <p className="font-label-sm text-on-surface-variant text-center opacity-70">
          This is not your normal portal login. Only use this on the computer your invigilator assigned you.
        </p>
      </div>
    </main>
  );
}
