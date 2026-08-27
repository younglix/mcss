import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const inputClasses = 'mcss-field w-full pl-11 pr-md hover:border-primary';

// The backend is the sole source of truth for what a user actually is —
// this only decides WHERE to land them, based on what /auth/login just
// returned. There's no portal picker on this page at all: one form, one
// submit, and the account's own role decides the destination.
function resolveHomePath({ permissions, user, requestedFrom }) {
  if (requestedFrom && requestedFrom !== '/login') return requestedFrom;
  if (permissions?.includes('*')) return '/super-admin';
  if (user?.user_type === 'parent') return '/parent';
  if (user?.user_type === 'student') return '/student';
  if (user?.user_type === 'staff') return '/admin';
  return '/';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyOtp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [otpChallenge, setOtpChallenge] = useState(null); // { challengeId } once 2FA is required
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    document.title = 'Portal Login | MCSS Portal';
  }, []);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;
  const requestedFrom = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setFormError('');
    setSubmitting(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.requiresOtp) {
        setOtpChallenge({ challengeId: result.challengeId });
      } else {
        navigate(resolveHomePath({ permissions: result.permissions, user: result.user, requestedFrom }));
      }
    } catch (err) {
      setFormError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6 || submitting) return;
    setFormError('');
    setSubmitting(true);
    try {
      const result = await verifyOtp(otpChallenge.challengeId, otpCode);
      navigate(resolveHomePath({ permissions: result.permissions, user: result.user, requestedFrom }));
    } catch (err) {
      setFormError(err.message || 'Invalid or expired code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-surface-container-lowest">
      <section className="hidden lg:flex flex-col justify-between w-[45%] bg-nav p-xl relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary-container rounded-full blur-[100px] opacity-30" />
        <div className="relative z-10 flex flex-col h-full">
          <Link to="/" className="flex items-center gap-md">
            <div className="w-16 h-16 flex items-center justify-center bg-surface-container-lowest rounded-lg shadow-md p-sm shrink-0">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-nav leading-tight">Mount Carmel</h1>
              <p className="font-label-md text-on-nav/70 tracking-[0.1em] uppercase">Secondary School</p>
            </div>
          </Link>

          <div className="mt-auto mb-12">
            <h2 className="font-headline-xl text-headline-lg text-on-nav max-w-md">Cultivating Excellence through Faith and Knowledge.</h2>
            <div className="mt-lg h-1 w-24 bg-tertiary-container" />
          </div>

          <div className="flex gap-lg mt-auto text-on-nav/70 font-label-md">
            <Link to="/" className="hover:text-on-nav transition-colors">
              Back to Site
            </Link>
            <a className="hover:text-on-nav transition-colors" href="#">
              IT Support
            </a>
            <a className="hover:text-on-nav transition-colors" href="#">
              Campus Safety
            </a>
          </div>
        </div>
      </section>

      <section className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden p-lg flex items-center justify-between border-b border-outline/10">
          <Link to="/" className="flex items-center gap-sm">
            <div className="w-8 h-8 bg-primary rounded p-1 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-lg">school</span>
            </div>
            <span className="font-headline-md text-headline-sm text-primary">MCSS Portal</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto my-auto p-lg flex flex-col gap-xl">
          <header className="flex flex-col gap-xs animate-fade-slide-in">
            <span className="font-label-md text-primary tracking-widest uppercase">Secure Access</span>
            <h2 className="font-headline-lg text-headline-md text-on-surface">Portal Login</h2>
            <p className="font-body-md text-on-surface-variant">
              Sign in with your email, Student ID, or Staff ID — we'll take you straight to your portal.
            </p>
          </header>

          {!otpChallenge && (
          <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface-variant" htmlFor="identifier">
                Email, Student ID, or Staff ID
              </label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">person</span>
                <input
                  className={inputClasses}
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. you@mountcarmel.edu or MC/2026/0001"
                  type="text"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-end">
                <label className="font-label-md text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <a className="font-label-sm text-secondary hover:underline" href="#">
                  Reset access?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">lock</span>
                <input
                  className={inputClasses}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant hover:text-primary"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-sm">
              <input className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" id="remember" type="checkbox" />
              <label className="font-label-md text-on-surface-variant cursor-pointer select-none" htmlFor="remember">
                Remember this device for 30 days
              </label>
            </div>

            {formError && (
              <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm" role="alert">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="bg-secondary text-on-secondary font-label-md font-bold py-md rounded shadow-sm hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98] flex items-center justify-center gap-sm mt-xs"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
              {!submitting && <span className="material-symbols-outlined text-body-md">login</span>}
            </button>
          </form>
          )}

          {otpChallenge && (
            <form className="flex flex-col gap-lg animate-fade-slide-in border-t border-outline/10 pt-lg" onSubmit={handleVerifyOtp}>
              <div>
                <h3 className="font-headline-md text-headline-sm text-on-surface">Enter Verification Code</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                  A 6-digit code was sent to your registered contact. It expires in 5 minutes.
                </p>
              </div>
              <input
                className={`${inputClasses} pl-md text-center tracking-[0.5em] font-headline-md text-headline-sm`}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
              <button
                type="submit"
                disabled={otpCode.length !== 6 || submitting}
                className="bg-primary text-on-primary font-label-md font-bold py-md rounded shadow-sm hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
              >
                {submitting ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpChallenge(null);
                  setOtpCode('');
                  setFormError('');
                }}
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary self-center"
              >
                Use a different account
              </button>
            </form>
          )}

          <footer className="flex flex-col gap-md pt-lg border-t border-outline/10">
            <div className="flex justify-between items-center text-on-surface-variant font-label-sm">
              <span>Need account activation?</span>
              <a className="text-primary font-label-md underline" href="#">
                Request Access
              </a>
            </div>
            <div className="bg-surface-container-high p-md rounded-lg flex gap-md items-start">
              <span className="material-symbols-outlined text-secondary">info</span>
              <p className="font-label-sm text-on-surface-variant">
                By logging in, you agree to the MCSS Acceptable Use Policy. All activity is monitored for institutional security.
              </p>
            </div>
          </footer>
        </div>

        <div className="mt-auto py-lg px-xl flex justify-center lg:justify-end">
          <span className="font-label-sm text-on-surface-variant opacity-60">© 2024 Mount Carmel Secondary School. All Rights Reserved.</span>
        </div>
      </section>
    </main>
  );
}
