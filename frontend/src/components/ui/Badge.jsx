import { cn } from '../../lib/cn.js';

const toneClasses = {
  primary: 'bg-primary text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  success: 'bg-secondary-container text-on-secondary-container',
  warning: 'bg-tertiary text-on-tertiary',
  error: 'bg-error-container text-on-error-container',
};

/**
 * Canonical status badge. Collapses the four inconsistent legacy variants
 * (`ribbon`, `ribbon-tag`, `ribbon-status`, `status-ribbon`) found across
 * the un-migrated screens into one implementation. Uses a deliberately
 * new class name (`mcss-badge-ribbon`, defined in src/style.css) so it
 * never collides with the unscoped, last-one-wins duplicate selectors in
 * stitch-exported.css.
 */
export default function Badge({ tone = 'primary', variant = 'pill', className = '', children }) {
  const shape = variant === 'ribbon' ? 'mcss-badge-ribbon px-md py-1' : 'rounded-full px-md py-0.5';
  return (
    <span
      className={cn('inline-flex items-center font-label-sm text-label-sm font-bold uppercase tracking-wide', shape, toneClasses[tone], className)}
    >
      {children}
    </span>
  );
}
