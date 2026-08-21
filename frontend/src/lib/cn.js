import { extendTailwindMerge } from 'tailwind-merge';

// This project's semantic design tokens (src/style.css @theme block) use names
// tailwind-merge's default config doesn't recognize, e.g. `text-on-primary`
// (a color) and `text-body-md` (a font size) both start with `text-` but
// belong to different Tailwind conflict groups. Without registering them,
// tailwind-merge lumps unrecognized `text-*` classes into one bucket and
// silently drops whichever came first — e.g. `text-on-primary text-body-md`
// collapsed to just `text-body-md`, leaving buttons with no text color.
const customColors = [
  'on-tertiary', 'error-container', 'on-secondary-fixed', 'on-primary-fixed-variant',
  'tertiary-fixed-dim', 'inverse-surface', 'tertiary', 'primary-container', 'on-primary-container',
  'surface-tint', 'on-primary', 'on-surface', 'surface', 'surface-variant', 'primary-fixed',
  'on-secondary-container', 'surface-dim', 'background', 'surface-container-high',
  'on-secondary-fixed-variant', 'secondary-fixed-dim', 'on-tertiary-fixed-variant', 'secondary-fixed',
  'on-secondary', 'outline-variant', 'surface-container-highest', 'surface-container', 'on-error',
  'surface-bright', 'outline', 'on-error-container', 'primary', 'on-background', 'on-surface-variant',
  'on-tertiary-fixed', 'inverse-on-surface', 'on-tertiary-container', 'tertiary-fixed',
  'surface-container-low', 'on-primary-fixed', 'error', 'primary-fixed-dim', 'secondary',
  'secondary-container', 'tertiary-container', 'surface-container-lowest', 'nav', 'on-nav',
  'inverse-primary',
];

const customFontSizes = [
  'headline-lg', 'headline-md', 'headline-sm', 'body-lg', 'headline-lg-mobile',
  'label-sm', 'headline-xl', 'label-md', 'body-md',
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: customColors,
      text: customFontSizes,
    },
  },
});

/**
 * Merges Tailwind class strings, letting later classes override earlier
 * ones that target the same CSS property (e.g. a passed-in `bg-secondary`
 * correctly wins over a component's own default `bg-surface-container-lowest`).
 * Plain string concatenation can silently lose that override depending on
 * Tailwind's generated stylesheet order, not the class-list order.
 */
export function cn(...classes) {
  return twMerge(classes.filter(Boolean).join(' '));
}
