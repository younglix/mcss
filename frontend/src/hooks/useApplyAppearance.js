import { useEffect } from 'react';
import { api } from '../lib/api.js';
import { applyRadiusOverride, applyTypographyOverrides } from '../lib/colorTokens.js';

/**
 * Applies the appearance settings that need auth to read (typography,
 * radius scale, logo variants) — colors are handled separately by
 * BrandingContext via the public endpoint so they work pre-login too.
 * Mounted once in AppShell so every authenticated Super Admin page picks
 * up the current theme, not just the Appearance settings page itself.
 */
export function useApplyAppearance() {
  useEffect(() => {
    let cancelled = false;
    api
      .get('/settings/?group=appearance')
      .then((settings) => {
        if (cancelled) return;
        const byKey = Object.fromEntries(settings.map((s) => [s.key, s.value]));
        applyTypographyOverrides({
          primaryFont: byKey['appearance.primary_font'],
          bodyFont: byKey['appearance.body_font'],
          headingFont: byKey['appearance.heading_font'],
          baseFontSize: byKey['appearance.base_font_size'],
        });
        applyRadiusOverride(byKey['appearance.radius_scale']);
      })
      .catch(() => {
        // Not authorized or not yet seeded — keep the built-in defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);
}
