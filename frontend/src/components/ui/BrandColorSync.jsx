import { useEffect } from 'react';
import { useBranding } from '../../context/BrandingContext.jsx';
import { useUIPreferences } from '../../context/UIPreferences.jsx';
import { applyColorOverrides } from '../../lib/colorTokens.js';

/**
 * Re-applies the configured brand colors whenever either input changes:
 * the branding data itself (loaded async, or edited in Appearance
 * settings), or the active theme (dark mode needs a different derived
 * tone than light — see colorTokens.js). Needs both contexts, so it's a
 * separate component nested inside both providers rather than logic
 * inside either one directly.
 */
export default function BrandColorSync() {
  const { branding } = useBranding();
  const { isDark } = useUIPreferences();

  useEffect(() => {
    applyColorOverrides({ primary: branding.primary_color, secondary: branding.secondary_color, isDark });
  }, [branding.primary_color, branding.secondary_color, isDark]);

  return null;
}
