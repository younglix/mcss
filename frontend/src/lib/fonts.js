// Curated list of 100+ Google Fonts an admin can pick as the app's heading,
// primary, or body font in Appearance settings — covers the common
// sans/serif/slab/display/mono families rather than Google's entire (much
// noisier) catalog. Kept as plain family-name strings, matching how they're
// already stored (`appearance.heading_font` etc. are just CSS font-family
// values) and how index.html's own static Google Fonts <link> names them.
export const GOOGLE_FONTS = [
  'Arimo', 'Archivo Narrow', 'Domine', 'Geist', 'Playfair Display',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Inter', 'Nunito', 'Nunito Sans',
  'Raleway', 'Ubuntu', 'Work Sans', 'Source Sans 3', 'Rubik', 'Mulish', 'Karla', 'Manrope',
  'DM Sans', 'Barlow', 'Lexend', 'Outfit', 'Plus Jakarta Sans', 'Figtree', 'Sora', 'Urbanist',
  'Public Sans', 'Space Grotesk', 'IBM Plex Sans', 'Noto Sans', 'PT Sans', 'Hind', 'Cabin',
  'Josefin Sans', 'Quicksand', 'Heebo', 'Asap', 'Jost', 'Overpass', 'Titillium Web',
  'Fira Sans', 'Oxygen', 'Muli', 'Varela Round', 'Exo 2', 'Saira', 'Red Hat Display',
  'Merriweather', 'Playfair Display SC', 'Lora', 'PT Serif', 'Noto Serif', 'Crimson Text',
  'Libre Baskerville', 'Bitter', 'EB Garamond', 'Cormorant', 'Cormorant Garamond', 'Source Serif 4',
  'IBM Plex Serif', 'Spectral', 'Vollkorn', 'Zilla Slab', 'Alegreya', 'Frank Ruhl Libre',
  'Crimson Pro', 'Newsreader', 'Domine SC', 'Faustina', 'Gelasio', 'Lusitana',
  'Roboto Slab', 'Josefin Slab', 'Arvo', 'Rokkitt', 'Aleo', 'Slabo 27px', 'Bevan',
  'Oswald', 'Anton', 'Archivo Black', 'Bebas Neue', 'Alfa Slab One', 'Passion One',
  'Righteous', 'Fjalla One', 'Abril Fatface', 'Comfortaa', 'Pacifico', 'Lobster',
  'Dancing Script', 'Great Vibes', 'Sacramento', 'Satisfy', 'Caveat', 'Shadows Into Light',
  'Indie Flower', 'Permanent Marker', 'Kalam', 'Patrick Hand', 'Amatic SC',
  'Playball', 'Courgette', 'Kaushan Script', 'Yellowtail', 'Cookie',
  'Roboto Mono', 'Space Mono', 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Source Code Pro',
  'Inconsolata', 'Courier Prime',
  'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', 'Cairo', 'Tajawal', 'Rubik Mono One',
];

const linkEl = { current: null };
const loaded = new Set();

/** Injects/updates one dynamic <link> so admin-selected fonts actually
 * render, not just get referenced by an unloaded font-family name (which
 * silently falls back to the generic sans-serif). Accumulates every family
 * ever requested this session into one link rather than one link per font,
 * and is a no-op once a family is already loaded. */
export function loadGoogleFonts(names) {
  const toAdd = (names || []).filter((n) => n && !loaded.has(n));
  if (toAdd.length === 0) return;
  toAdd.forEach((n) => loaded.add(n));

  if (!linkEl.current) {
    linkEl.current = document.createElement('link');
    linkEl.current.rel = 'stylesheet';
    document.head.appendChild(linkEl.current);
  }
  const families = [...loaded]
    .map((n) => `family=${encodeURIComponent(n).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');
  linkEl.current.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
