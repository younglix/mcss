import Card from './Card.jsx';
import Badge from './Badge.jsx';

const iconToneClasses = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  success: 'bg-secondary-container text-on-secondary-container',
  error: 'bg-error-container text-on-error-container',
};

const deltaToneClasses = {
  up: 'text-secondary',
  down: 'text-on-error-container',
  flat: 'text-on-surface-variant',
};

const deltaIcon = {
  up: 'trending_up',
  down: 'trending_down',
  flat: 'trending_flat',
};

/**
 * Dashboard stat tile matching the reference screen's pattern: uppercase
 * label, large headline number, icon in a tinted circular badge, and
 * either a trend delta or a progress bar underneath (mutually exclusive).
 */
export default function StatCard({ icon, iconTone = 'primary', label, value, valueBadge, delta, progress, helperText }) {
  return (
    <Card padding="lg" className="flex flex-col">
      <div className="flex justify-between items-start mb-sm">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{label}</p>
        <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconToneClasses[iconTone]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      </div>
      <div className="flex items-baseline gap-sm">
        <p className="font-headline-xl text-headline-xl text-primary leading-none">{value}</p>
        {valueBadge && <Badge tone={valueBadge.tone || 'success'}>{valueBadge.text}</Badge>}
      </div>

      {delta && (
        <div className={`flex items-center gap-1 mt-md font-label-md text-label-md font-bold ${deltaToneClasses[delta.direction]}`}>
          <span className="material-symbols-outlined text-[16px]">{deltaIcon[delta.direction]}</span>
          <span>{delta.text}</span>
        </div>
      )}

      {progress && (
        <div className="mt-md w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${progress.percent}%` }} />
        </div>
      )}

      {helperText && <p className="font-body-md text-body-md text-on-surface-variant mt-sm">{helperText}</p>}
    </Card>
  );
}
