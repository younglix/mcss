import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clearExamSession, examApi, ExamApiError, getExamMeta, getExamToken } from '../../lib/examApi.js';

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Fire-and-best-effort — used only for the exit beacon, which has to have
 * a real chance of completing while the tab is already unloading. A plain
 * `fetch` gets cancelled the instant the page goes away; `keepalive: true`
 * is what lets the browser finish it in the background regardless. */
function sendExitBeacon(attemptId) {
  const token = getExamToken();
  if (!token || !attemptId) return;
  try {
    fetch(`/api/v1/exam/attempts/${attemptId}/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      keepalive: true,
    });
  } catch {
    // best-effort only — nothing more to do from an unloading tab
  }
}

export default function ExamTake() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const meta = getExamMeta();

  const [phase, setPhase] = useState('warning'); // warning -> starting -> exam -> done -> ended
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [startError, setStartError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [endedMessage, setEndedMessage] = useState('');

  const statusRef = useRef('warning');
  useEffect(() => { statusRef.current = phase; }, [phase]);

  useEffect(() => {
    if (!getExamToken()) {
      navigate('/exam-access', { replace: true });
    }
  }, [navigate]);

  // Live countdown, ticking off the server-issued deadline — not a
  // locally-set timer, so a paused tab or clock drift never grants extra
  // time (the server is what actually decides when it's over).
  useEffect(() => {
    if (phase !== 'exam') return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const deadlineMs = attempt ? new Date(attempt.deadline).getTime() : null;
  const remainingMs = deadlineMs ? deadlineMs - now : null;

  const handleSubmit = useCallback(async (attemptId) => {
    if (statusRef.current !== 'exam') return;
    setSubmitting(true);
    try {
      await examApi.post(`/exam/attempts/${attemptId}/submit`, {});
      setPhase('done');
    } catch (err) {
      if (err instanceof ExamApiError && err.status === 409) {
        setPhase('done');
      } else {
        // Network hiccup right at time-up — the server-side deadline sweep
        // is the belt-and-braces backstop, so this isn't left unresolved.
        setSubmitting(false);
      }
    }
  }, []);

  // Time's up — freeze the interface and submit; the server itself decides
  // clean vs. timeout-penalized based on the deadline, not on which moment
  // this call happens to land (see backend AttemptSubmitView).
  useEffect(() => {
    if (phase === 'exam' && remainingMs !== null && remainingMs <= 0 && !submitting) {
      handleSubmit(attempt.id);
    }
  }, [phase, remainingMs, submitting, attempt, handleSubmit]);

  const handleStart = async () => {
    setStartError('');
    setPhase('starting');
    try {
      const result = await examApi.post(`/exam/exams/${examId}/attempts/start`, {});
      setAttempt(result);
      setAnswers(result.answers || {});
      setPhase('exam');
    } catch (err) {
      setStartError(err instanceof ExamApiError ? err.message : 'Could not start this exam.');
      setPhase('warning');
    }
  };

  const handleAnswer = (questionId, letter) => {
    if (phase !== 'exam' || submitting) return;
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
    examApi.post(`/exam/attempts/${attempt.id}/answer`, { question_id: questionId, answer: letter }).catch((err) => {
      if (err instanceof ExamApiError && err.status === 409) {
        setEndedMessage('This exam has ended.');
        setPhase('ended');
      }
      // any other transient failure just leaves the pick saved locally —
      // the next successful pick's autosave carries it forward anyway.
    });
  };

  // Leave-the-page detection — fires the exit beacon the instant the
  // student switches away, no second confirmation prompt of our own (the
  // rules were already acknowledged on the warning screen before Start).
  useEffect(() => {
    if (phase !== 'exam') return undefined;
    const attemptId = attempt?.id;
    const onLeave = () => {
      if (statusRef.current !== 'exam') return;
      statusRef.current = 'ended-pending';
      sendExitBeacon(attemptId);
      setEndedMessage('You left the exam window, so it was submitted automatically.');
      setPhase('ended');
    };
    const onVisibility = () => { if (document.hidden) onLeave(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onLeave);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [phase, attempt]);

  const questions = attempt?.questions || [];
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[current];

  const lowTime = remainingMs !== null && remainingMs <= 5 * 60 * 1000;

  if (phase === 'done') {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-surface-container-lowest p-lg">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-md bg-surface-container-lowest border border-outline/10 rounded-xl shadow-sm p-xl">
          <span className="material-symbols-outlined text-secondary text-5xl">check_circle</span>
          <h1 className="font-headline-lg text-headline-md text-on-surface">Exam Submitted</h1>
          <p className="font-body-md text-on-surface-variant">
            Your answers have been recorded. You may now close this window and return your device to the invigilator.
          </p>
          <button
            type="button"
            onClick={() => { clearExamSession(); navigate('/exam-access', { replace: true }); }}
            className="font-label-md text-label-md text-primary hover:underline mt-sm"
          >
            Done
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'ended') {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-surface-container-lowest p-lg">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-md bg-surface-container-lowest border border-error/20 rounded-xl shadow-sm p-xl">
          <span className="material-symbols-outlined text-error text-5xl">warning</span>
          <h1 className="font-headline-lg text-headline-md text-on-surface">Exam Closed</h1>
          <p className="font-body-md text-on-surface-variant">{endedMessage || 'This exam is no longer open.'}</p>
          <button
            type="button"
            onClick={() => { clearExamSession(); navigate('/exam-access', { replace: true }); }}
            className="font-label-md text-label-md text-primary hover:underline mt-sm"
          >
            Done
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'warning' || phase === 'starting') {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-surface-container-lowest p-lg">
        <div className="max-w-lg w-full bg-surface-container-lowest border border-outline/10 rounded-xl shadow-sm p-xl flex flex-col gap-lg">
          <div>
            <h1 className="font-headline-lg text-headline-md text-on-surface">{meta?.examTitle || 'Your Exam'}</h1>
            {meta?.studentName && <p className="font-body-md text-on-surface-variant mt-xs">Signed in as {meta.studentName}</p>}
          </div>

          <div className="bg-error-container/10 border border-error/20 rounded-lg p-lg space-y-sm">
            <h2 className="font-label-md text-label-md text-error uppercase tracking-wide">Before You Start</h2>
            <ul className="list-disc list-inside font-body-md text-body-md text-on-surface space-y-xs">
              <li>You have {meta?.durationMinutes ? `${meta.durationMinutes} minutes` : 'a fixed time'} once you press Start — the clock does not pause.</li>
              <li>Your answers are saved automatically as you pick them.</li>
              <li>Switching to another tab, app, or window submits your exam immediately with a penalty — there is no warning once you start.</li>
              <li>You get one attempt. Only your invigilator can grant a reset for a genuine technical failure.</li>
              <li>Submit manually with the Submit button once you've answered everything.</li>
            </ul>
          </div>

          {startError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{startError}</p>
          )}

          <label className="flex items-start gap-sm cursor-pointer">
            <input
              type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-5 h-5 mt-1 rounded border-outline text-primary focus:ring-primary"
            />
            <span className="font-body-md text-body-md text-on-surface">I have read and understood the rules above.</span>
          </label>

          <button
            type="button"
            onClick={handleStart}
            disabled={!acknowledged || phase === 'starting'}
            className="bg-secondary text-on-secondary font-label-md font-bold py-md rounded shadow-sm hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
          >
            {phase === 'starting' ? 'Starting…' : 'Start Exam'}
          </button>
        </div>
      </main>
    );
  }

  // phase === 'exam'
  return (
    <main className="min-h-screen w-full bg-surface-container-lowest flex flex-col">
      <header className={`sticky top-0 z-10 flex items-center justify-between gap-md px-lg py-md border-b ${lowTime ? 'bg-error-container/20 border-error/30' : 'bg-surface-container-lowest border-outline/10'}`}>
        <div>
          <h1 className="font-headline-md text-headline-sm text-on-surface">{meta?.examTitle || 'Exam'}</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{answeredCount} / {questions.length} answered</p>
        </div>
        <div className={`font-headline-md text-headline-sm tabular-nums ${lowTime ? 'text-error' : 'text-on-surface'}`}>
          {remainingMs !== null ? formatClock(remainingMs) : '--:--'}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-lg p-lg max-w-4xl w-full mx-auto">
        <div className="flex-1 bg-surface-container-lowest border border-outline/10 rounded-xl shadow-sm p-xl flex flex-col gap-lg">
          {currentQuestion && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm">Question {current + 1} of {questions.length}</p>
              <p className="font-body-lg text-body-lg text-on-surface">{currentQuestion.text}</p>
              <div className="mt-lg space-y-sm">
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <label
                    key={letter}
                    className={`flex items-center gap-md p-md rounded-lg border cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === letter ? 'border-primary bg-primary-container/20' : 'border-outline/20 hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={answers[currentQuestion.id] === letter}
                      onChange={() => handleAnswer(currentQuestion.id, letter)}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-body-md text-body-md text-on-surface">{letter}) {currentQuestion.options[letter]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-lg border-t border-outline/10">
            <button
              type="button" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary disabled:opacity-30"
            >
              ← Previous
            </button>
            {current < questions.length - 1 ? (
              <button
                type="button" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                className="font-label-md text-label-md text-primary hover:underline"
              >
                Next →
              </button>
            ) : (
              <button
                type="button" onClick={() => handleSubmit(attempt.id)} disabled={submitting}
                className="bg-secondary text-on-secondary font-label-md font-bold px-lg py-sm rounded shadow-sm hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : 'Submit Exam'}
              </button>
            )}
          </div>
        </div>

        <aside className="lg:w-56 bg-surface-container-lowest border border-outline/10 rounded-xl shadow-sm p-lg h-fit">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-sm">Questions</p>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-xs">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-9 rounded font-label-sm text-label-sm flex items-center justify-center transition-colors ${
                  i === current
                    ? 'bg-primary text-on-primary'
                    : answers[q.id]
                      ? 'bg-secondary-container text-on-surface'
                      : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button" onClick={() => handleSubmit(attempt.id)} disabled={submitting}
            className="w-full mt-lg bg-secondary text-on-secondary font-label-md font-bold py-sm rounded shadow-sm hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </aside>
      </div>
    </main>
  );
}
