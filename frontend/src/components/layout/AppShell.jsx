import { useNavigate } from 'react-router-dom';
import { getPortal } from '../../config/portals.js';
import usePageTitle from '../../hooks/usePageTitle.js';
import { useBranding } from '../../context/BrandingContext.jsx';
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
export default function AppShell({ portalId, pageTitle, user, children }) {
  const portal = getPortal(portalId);
  const navigate = useNavigate();
  const { branding } = useBranding();
  useApplyAppearance();
  usePageTitle(pageTitle || portal.label);

  // Real school identity (General settings) wins over the static per-portal
  // fallback — this is what makes editing the school name/logo actually
  // show up in the chrome instead of just being saved to a table.
  const wordmark = branding.short_name || branding.name || portal.brand.wordmark;
  const brand = { ...portal.brand, wordmark, logoUrl: branding.logo || undefined };

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print">
        <TopHeader
          wordmark={wordmark}
          logoUrl={brand.logoUrl}
          homePath={portal.homePath}
          avatarUrl={user?.avatarUrl}
          avatarAlt={user?.name}
          avatarFallback={user?.name?.match(/\b\w/g)?.slice(0, 2).join('').toUpperCase()}
        />
        <Sidebar items={portal.sidebarNav} brand={brand} onSignOut={() => navigate('/login')} />
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
