import { useEffect } from 'react';
import { useBranding } from '../../context/BrandingContext.jsx';
import { useUIPreferences } from '../../context/UIPreferences.jsx';
import { applyColorOverrides, applyTypographyOverrides } from '../../lib/colorTokens.js';

/**
 * Re-applies branding-derived DOM side effects whenever the underlying
 * data changes: colors (needs the active theme too — dark mode wants a
 * different derived tone, see colorTokens.js), typography, and the
 * browser-tab favicon. Mounted unconditionally at the app root (unlike
 * useApplyAppearance, which only runs inside an authenticated portal shell),
 * so a configured font/color reaches public pages — landing, login, Apply
 * Now — before anyone signs in, not just the authenticated app.
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
    applyTypographyOverrides({
      headingFont: branding.heading_font,
      primaryFont: branding.primary_font,
      bodyFont: branding.body_font,
      baseFontSize: branding.base_font_size,
    });
  }, [branding.heading_font, branding.primary_font, branding.body_font, branding.base_font_size]);

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
