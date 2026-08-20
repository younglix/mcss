import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';

const variantClasses = {
  primary: 'bg-primary text-on-primary hover:opacity-90 shadow-sm',
  secondary: 'bg-transparent text-secondary border border-secondary hover:bg-secondary/5',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low',
};

const sizeClasses = {
  sm: 'px-md py-xs text-sm min-h-[38px]',
  md: 'px-lg py-sm text-body-md min-h-[44px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  to,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-xs font-label-md text-label-md font-bold rounded transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const content = (
    <>
      {iconLeft && <span className="material-symbols-outlined text-[18px]">{iconLeft}</span>}
      {children}
      {iconRight && <span className="material-symbols-outlined text-[18px]">{iconRight}</span>}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {content}
    </button>
  );
}
