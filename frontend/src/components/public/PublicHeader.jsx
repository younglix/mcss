import { useState } from 'react';
import { Link } from 'react-router-dom';
import { navLinks } from '../../pages/Public/landingData.js';
import PreferenceControls from '../ui/PreferenceControls.jsx';
import { useBranding } from '../../context/BrandingContext.jsx';

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { branding } = useBranding();

  return (
    <>
      <header className="bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline/10 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
          <Link to="/" className="flex items-center gap-sm">
            {branding.landscape_logo ? (
              <img src={branding.landscape_logo} alt={branding.name} className="h-10 w-auto max-w-full object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm shrink-0 overflow-hidden">
                  {branding.logo ? (
                    <img src={branding.logo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="material-symbols-outlined text-on-primary">school</span>
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-headline-md text-body-lg font-bold text-primary">{branding.short_name || branding.name}</span>
                  <span className="text-label-xs tracking-[0.2em] uppercase text-secondary font-bold">Secondary School</span>
                </div>
              </>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-xl">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.path} className="font-body-md text-on-surface-variant hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-md">
            <PreferenceControls className="hidden sm:flex" />
            <Link to="/login" className="hidden sm:inline-flex bg-primary text-on-primary px-lg py-2 font-label-md rounded-sm hover:opacity-90 transition-all">
              Staff Login
            </Link>
            <button className="md:hidden text-primary" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[70] bg-nav text-on-nav flex flex-col p-10 transition-transform duration-300 md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-center mb-12">
          <PreferenceControls tone="inverse" />
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
        </div>
        <nav className="flex flex-col gap-8">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.path} onClick={() => setMenuOpen(false)} className="font-headline-md text-4xl hover:text-tertiary-fixed transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-10 border-t border-on-nav/10">
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="w-full block text-center bg-tertiary-container text-on-tertiary-container py-4 font-label-md font-bold tracking-widest uppercase rounded"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </>
  );
}
