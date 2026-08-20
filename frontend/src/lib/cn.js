import { twMerge } from 'tailwind-merge';

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
