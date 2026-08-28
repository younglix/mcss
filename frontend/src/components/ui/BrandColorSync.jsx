import { useEffect } from 'react';
import { useBranding } from '../../context/BrandingContext.jsx';
import { useUIPreferences } from '../../context/UIPreferences.jsx';
import { applyColorOverrides } from '../../lib/colorTokens.js';

/**
 * Re-applies branding-derived DOM side effects whenever the underlying
 * data changes: colors (needs the active theme too — dark mode wants a
 * different derived tone, see colorTokens.js) and the browser-tab favicon.
 * Needs both the branding and theme contexts, so it's a separate component
 * nested inside both providers rather than logic inside either one directly.
 */
export default function BrandColorSync() {
  const { branding } = useBranding();
  const { isDark } = useUIPreferences();

  useEffect(() => {
    applyColorOverrides({ primary: branding.primary_color, secondary: branding.secondary_color, isDark });
  }, [branding.primary_color, branding.secondary_color, isDark]);

  useEffect(() => {
    if (!branding.favicon) return;
    let link = document.querySelector('link[rel~="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.favicon;
  }, [branding.favicon]);

  return null;
}
