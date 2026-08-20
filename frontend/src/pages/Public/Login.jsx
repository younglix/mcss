import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { categories, familyRoles, staffRoles, superAdmin, detectFamilyRole } from './loginData.js';

const inputClasses =
  'w-full bg-surface-container-lowest border border-outline/30 pl-11 pr-4 py-3 font-body-md text-on-surface rounded transition-all hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none';

export default function Login() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(categories[0].key);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState(null);

  useEffect(() => {
    document.title = 'Portal Login | MCSS Portal';
  }, []);

  useEffect(() => {
    setIdentifier('');
    setSelectedStaffRole(null);
  }, [activeCategory]);

  const detectedFamily = activeCategory === 'family' ? detectFamilyRole(identifier) : null;

  const idField =
    activeCategory === 'family'
      ? { label: 'Student ID or Parent Email/Phone', placeholder: 'e.g. MC-2024-001 or parent@email.com' }
      : activeCategory === 'staff'
        ? { label: selectedStaffRole ? `${selectedStaffRole.label} ID Number` : 'Staff ID Number', placeholder: 'e.g. MC-STAFF-021' }
        : { label: superAdmin.idLabel, placeholder: superAdmin.placeholder };

  const canSubmit =
    identifier.trim().length > 0 && (activeCategory === 'family' ? !!detectedFamily : activeCategory === 'staff' ? !!selectedStaffRole : true);

  const submitLabel =
    activeCategory === 'family'
      ? detectedFamily
        ? `Continue as ${familyRoles[detectedFamily].label}`
        : 'Authenticate Securely'
      : activeCategory === 'staff'
        ? selectedStaffRole
          ? `Continue as ${selectedStaffRole.label}`
          : 'Select a role to continue'
        : 'Authenticate as Super Admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (activeCategory === 'family') navigate(familyRoles[detectedFamily].homePath);
    else if (activeCategory === 'staff') navigate(selectedStaffRole.homePath);
    else navigate(superAdmin.homePath);
  };

  return (
    <main className="flex min-h-screen w-full bg-surface-container-lowest">
      <section className="hidden lg:flex flex-col justify-between w-[45%] bg-primary p-xl relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary-container rounded-full blur-[100px] opacity-30" />
        <div className="relative z-10 flex flex-col h-full">
          <Link to="/" className="flex items-center gap-md">
            <div className="w-16 h-16 flex items-center justify-center bg-surface-container-lowest rounded-lg shadow-md p-sm shrink-0">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-primary leading-tight">Mount Carmel</h1>
              <p className="font-label-md text-on-primary/70 tracking-[0.1em] uppercase">Secondary School</p>
            </div>
          </Link>

          <div className="mt-auto mb-12">
            <h2 className="font-headline-xl text-headline-lg text-on-primary max-w-md">Cultivating Excellence through Faith and Knowledge.</h2>
            <div className="mt-lg h-1 w-24 bg-tertiary-container" />
          </div>

          <div className="flex gap-lg mt-auto text-on-primary/70 font-label-md">
            <Link to="/" className="hover:text-on-primary transition-colors">
              Back to Site
            </Link>
            <a className="hover:text-on-primary transition-colors" href="#">
              IT Support
            </a>
            <a className="hover:text-on-primary transition-colors" href="#">
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
            <h2 className="font-headline-lg text-headline-md text-on-surface">Institutional Portal</h2>
            <p className="font-body-md text-on-surface-variant">Choose your portal category to authenticate.</p>
          </header>

          <div className="grid grid-cols-3 gap-sm">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`flex flex-col items-center justify-center gap-1 py-md px-sm rounded-lg border-2 transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'border-primary bg-primary text-on-primary shadow-md scale-[1.02]'
                    : 'border-outline/15 bg-surface-container-lowest text-on-surface-variant hover:border-primary/40'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                <span className="font-label-sm text-label-sm font-bold text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>

          <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
            <div key={activeCategory} className="flex flex-col gap-lg animate-fade-slide-in">
              <p className="font-label-sm text-label-sm text-on-surface-variant -mt-xs">{categories.find((c) => c.key === activeCategory).description}</p>

              {activeCategory === 'staff' && (
                <div className="grid grid-cols-3 gap-xs">
                  {staffRoles.map((role) => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setSelectedStaffRole(role)}
                      className={`flex flex-col items-center justify-center gap-1 p-xs py-sm rounded-lg border transition-all duration-200 ${
                        selectedStaffRole?.key === role.key ? 'border-primary bg-primary/5 text-primary' : 'border-outline/15 text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{role.icon}</span>
                      <span className="font-label-sm text-[10px] font-bold text-center leading-tight">{role.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-on-surface-variant" htmlFor="identifier">
                  {idField.label}
                </label>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">person</span>
                  <input
                    className={inputClasses}
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={idField.placeholder}
                    type="text"
                  />
                </div>
                {activeCategory === 'family' && (
                  <div className="min-h-6">
                    {detectedFamily && (
                      <span
                        key={detectedFamily}
                        className="animate-fade-slide-in inline-flex items-center gap-xs bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label-sm text-label-sm font-bold mt-xs"
                      >
                        <span className="material-symbols-outlined text-sm">{familyRoles[detectedFamily].icon}</span>
                        Detected: {familyRoles[detectedFamily].label} Portal
                      </span>
                    )}
                  </div>
                )}
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
                <input className={inputClasses} id="password" placeholder="••••••••" type={showPassword ? 'text' : 'password'} />
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
              <input className="w-4 h-4 rounded border-outline text-primary focus:ring-primary" id="remember" type="checkbox" />
              <label className="font-label-md text-on-surface-variant cursor-pointer select-none" htmlFor="remember">
                Remember this device for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-secondary text-on-secondary font-label-md font-bold py-md rounded shadow-sm hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98] flex items-center justify-center gap-sm mt-xs"
            >
              {submitLabel}
              <span className="material-symbols-outlined text-body-md">login</span>
            </button>
          </form>

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
