// Derives the small set of paired color roles (container/on-* tints) a
// custom primary/secondary color needs from just the one hex value an admin
// picks — a lightweight stand-in for a full Material tonal-palette system
// (HCT color space etc.), good enough to keep contrast sane without pulling
// in a color-science dependency.

function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isValidHex(hex) {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** Everything a `primary` (or `secondary`/`tertiary`) role needs: the base
 * color, a container tint, and on-* text colors chosen by contrast against
 * each. In dark mode the roles invert per Material 3 convention (the base
 * tone becomes light so it reads against a dark surface, the container
 * becomes a muted mid-dark fill instead of a pale tint) — mirroring the
 * hand-tuned light->dark remap already baked into style.css's :root.dark
 * block, just derived from whatever hex an admin picked instead of the
 * built-in brand hue. Without this split, a configured brand color pins
 * --color-primary etc. to their light-mode values via inline style (higher
 * specificity than the :root.dark class rule), leaving primary-colored text
 * dark-on-dark and unreadable whenever dark mode is active. */
export function deriveColorRole(hex, isDark = false) {
  if (!isValidHex(hex)) return null;
  const { h, s, l } = hexToHsl(hex);
  if (isDark) {
    return {
      base: hslToHex(h, Math.min(s, 55), 82),
      onBase: hslToHex(h, Math.min(s, 60), 18),
      container: hslToHex(h, Math.min(s, 45), 34),
      onContainer: hslToHex(h, Math.min(s, 35), 92),
    };
  }
  return {
    base: hex,
    container: hslToHex(h, Math.min(s, 40), 90),
    onContainer: hslToHex(h, Math.min(s + 10, 60), 20),
    onBase: l > 60 ? '#1a1c1c' : '#ffffff',
  };
}

/** Applies primary/secondary overrides as CSS custom properties on :root —
 * every `bg-primary` / `text-on-primary` / etc. Tailwind utility reads these
 * at paint time, so this is a real, immediate global theme change. Must be
 * re-called whenever the active theme flips (see BrandColorSync), since the
 * derived values differ between light and dark. */
export function applyColorOverrides({ primary, secondary, isDark = false } = {}) {
  const root = document.documentElement.style;
  const primaryRole = deriveColorRole(primary, isDark);
  if (primaryRole) {
    root.setProperty('--color-primary', primaryRole.base);
    root.setProperty('--color-on-primary', primaryRole.onBase);
    root.setProperty('--color-primary-container', primaryRole.container);
    root.setProperty('--color-on-primary-container', primaryRole.onContainer);
  }
  const secondaryRole = deriveColorRole(secondary, isDark);
  if (secondaryRole) {
    root.setProperty('--color-secondary', secondaryRole.base);
    root.setProperty('--color-on-secondary', secondaryRole.onBase);
    root.setProperty('--color-secondary-container', secondaryRole.container);
    root.setProperty('--color-on-secondary-container', secondaryRole.onContainer);
  }
}

export function applyTypographyOverrides({ primaryFont, bodyFont, headingFont, baseFontSize } = {}) {
  const root = document.documentElement.style;
  if (headingFont) root.setProperty('--font-headline', `${headingFont}, sans-serif`);
  if (primaryFont) root.setProperty('--font-display', `${primaryFont}, sans-serif`);
  if (bodyFont) root.setProperty('--font-body', `${bodyFont}, sans-serif`);
  if (baseFontSize) document.documentElement.style.fontSize = `${baseFontSize}px`;
}

const RADIUS_SCALES = {
  compact: { base: '0.5rem', sm: '0.25rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
  default: { base: '1rem', sm: '0.5rem', md: '1.5rem', lg: '2rem', xl: '3rem' },
  soft: { base: '1.5rem', sm: '0.75rem', md: '2rem', lg: '2.5rem', xl: '3.5rem' },
};

export function applyRadiusOverride(scaleName) {
  const scale = RADIUS_SCALES[scaleName] || RADIUS_SCALES.default;
  const root = document.documentElement.style;
  root.setProperty('--radius', scale.base);
  root.setProperty('--radius-sm', scale.sm);
  root.setProperty('--radius-md', scale.md);
  root.setProperty('--radius-lg', scale.lg);
  root.setProperty('--radius-xl', scale.xl);
}

export const RADIUS_SCALE_OPTIONS = Object.keys(RADIUS_SCALES);
