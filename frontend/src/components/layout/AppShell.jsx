import { useNavigate } from 'react-router-dom';
import { getPortal } from '../../config/portals.js';
import usePageTitle from '../../hooks/usePageTitle.js';
import { useBranding } from '../../context/BrandingContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUIPreferences } from '../../context/UIPreferences.jsx';
import { useApplyAppearance } from '../../hooks/useApplyAppearance.js';
import TopHeader from './TopHeader.jsx';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';

/**
 * Shared portal shell: top header, desktop sidebar, mobile bottom nav,
 * driven entirely by the per-portal nav config in src/config/portals.js
 * so nav items can't drift out of sync again. Active-state highlighting
 * is resolved by react-router's <NavLink> against the current route.
 */
export default function AppShell({ portalId, pageTitle, children }) {
  const portal = getPortal(portalId);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { branding } = useBranding();
  const { isDark } = useUIPreferences();
  useApplyAppearance();
  usePageTitle(pageTitle || portal.label);

  // Real school identity (General settings) wins over the static per-portal
  // fallback — this is what makes editing the school name/logo actually
  // show up in the chrome instead of just being saved to a table. The
  // theme-specific logo is optional per school — falls back to the one
  // default logo when only that's been set.
  const wordmark = branding.short_name || branding.name || portal.brand.wordmark;
  const themedLogo = isDark ? branding.dark_logo : branding.light_logo;
  const brand = { ...portal.brand, wordmark, logoUrl: themedLogo || branding.logo || undefined };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print">
        <TopHeader wordmark={wordmark} logoUrl={brand.logoUrl} homePath={portal.homePath} portalId={portalId} />
        <Sidebar items={portal.sidebarNav} brand={brand} onSignOut={handleSignOut} />
      </div>
      <main className="lg:ml-72 pb-24 lg:pb-xl px-md sm:px-gutter xl:px-xl pt-lg max-w-container-max mx-auto print:ml-0 print:p-0 print:max-w-none">
        {children}
      </main>
      <div className="no-print">
        <BottomNav items={portal.bottomNav} fullNav={portal.sidebarNav} />
      </div>
    </div>
  );
}
