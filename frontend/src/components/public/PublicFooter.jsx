import { footerLinks } from '../../pages/Public/landingData.js';
import { useBranding } from '../../context/BrandingContext.jsx';

export default function PublicFooter() {
  const { branding } = useBranding();

  return (
    <footer className="bg-nav text-on-nav">
      <div className="w-full py-xl px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-xl mb-xl">
          <div>
            <div className="flex items-center gap-sm mb-lg">
              <div className="w-8 h-8 bg-on-nav/10 flex items-center justify-center rounded overflow-hidden shrink-0">
                {branding.logo ? (
                  <img src={branding.logo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-lg">school</span>
                )}
              </div>
              <h4 className="font-headline-md text-headline-md">{branding.short_name || branding.name}</h4>
            </div>
            <p className="opacity-80 leading-relaxed mb-lg">{branding.motto || 'Nurturing excellence through divine wisdom and technical precision.'}</p>
            <div className="flex gap-md">
              <a className="w-10 h-10 bg-on-nav/10 flex items-center justify-center hover:bg-on-nav/20 transition-colors rounded-full" href="#">
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a className="w-10 h-10 bg-on-nav/10 flex items-center justify-center hover:bg-on-nav/20 transition-colors rounded-full" href="#">
                <span className="material-symbols-outlined text-sm">alternate_email</span>
              </a>
            </div>
          </div>

          <div>
            <h5 className="font-label-md uppercase tracking-widest mb-lg text-tertiary-fixed">Explore</h5>
            <ul className="space-y-md">
              {footerLinks.explore.map((link) => (
                <li key={link}>
                  <a className="opacity-80 hover:opacity-100 transition-opacity" href="#">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-label-md uppercase tracking-widest mb-lg text-tertiary-fixed">Resources</h5>
            <ul className="space-y-md">
              {footerLinks.resources.map((link) => (
                <li key={link}>
                  <a className="opacity-80 hover:opacity-100 transition-opacity" href="#">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-label-md uppercase tracking-widest mb-lg text-tertiary-fixed">Contact</h5>
            <ul className="space-y-md">
              {branding.address && (
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-tertiary-fixed">location_on</span>
                  <span className="opacity-80">{branding.address}</span>
                </li>
              )}
              {branding.phone && (
                <li className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-tertiary-fixed">call</span>
                  <span className="opacity-80">{branding.phone}</span>
                </li>
              )}
              {branding.email && (
                <li className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-tertiary-fixed">mail</span>
                  <span className="opacity-80">{branding.email}</span>
                </li>
              )}
              {!branding.address && !branding.phone && !branding.email && (
                <li className="opacity-60 italic">Contact details coming soon.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-on-nav/10 pt-lg flex flex-col md:flex-row justify-between items-center gap-md text-center md:text-left">
          <p className="font-label-sm opacity-80">© {new Date().getFullYear()} {branding.name}. All Rights Reserved.</p>
          <div className="flex gap-xl font-label-sm">
            <a className="opacity-80 hover:opacity-100" href="#">
              Privacy Policy
            </a>
            <a className="opacity-80 hover:opacity-100" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
