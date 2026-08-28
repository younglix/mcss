import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const BrandingContext = createContext(null);

const FALLBACK = {
  name: 'Mount Carmel', short_name: '', logo: '', favicon: '', motto: '',
  primary_color: '', secondary_color: '', light_logo: '', dark_logo: '', landscape_logo: '',
};

/**
 * School identity + theme colors, loaded once at app boot from the
 * unauthenticated /settings/public-branding endpoint — this is what makes
 * "change the primary color in Appearance settings" actually repaint the
 * whole app (including the login screen), not just save a value nobody
 * reads. The actual CSS custom-property writes happen in BrandColorSync
 * (rendered inside UIPreferencesProvider), not here — applying them needs
 * to know the active light/dark theme too, which this provider doesn't.
 */
export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/settings/public-branding', { auth: false });
      setBranding({ ...FALLBACK, ...data });
    } catch {
      // Public endpoint down or unseeded — keep the built-in fallback theme
      // rather than leaving the page unstyled.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <BrandingContext.Provider value={{ branding, loading, refresh }}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
