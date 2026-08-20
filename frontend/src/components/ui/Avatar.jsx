import { cn } from '../../lib/cn.js';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export default function Avatar({ src, alt = '', size = 'md', fallbackInitials, className = '' }) {
  const sizing = sizeClasses[size];
  if (src) {
    return (
      <img src={src} alt={alt} className={cn(sizing, 'rounded-full object-cover border border-outline/20', className)} />
    );
  }
  return (
    <span
      className={cn(sizing, 'rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-md font-bold', className)}
      role="img"
      aria-label={alt}
    >
      {fallbackInitials}
    </span>
  );
}
