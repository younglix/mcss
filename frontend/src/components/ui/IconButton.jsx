import { cn } from '../../lib/cn.js';

export default function IconButton({ icon, label, onClick, tone = 'default', badge, className = '' }) {
  const toneClasses =
    tone === 'inverse'
      ? 'text-on-primary/80 hover:text-on-primary hover:bg-on-primary/10'
      : 'text-on-surface-variant hover:bg-surface-container-low';

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn('relative p-sm rounded-full min-h-11 min-w-11 flex items-center justify-center transition-colors', toneClasses, className)}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {badge && <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full ring-2 ring-surface" />}
    </button>
  );
}
