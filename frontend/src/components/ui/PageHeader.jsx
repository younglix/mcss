import { cn } from '../../lib/cn.js';

export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-end md:justify-between gap-md', className)}>
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">{title}</h1>
        {subtitle && <p className="font-body-lg text-body-md md:text-body-lg text-on-surface-variant mt-xs">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-sm">{actions}</div>}
    </div>
  );
}
