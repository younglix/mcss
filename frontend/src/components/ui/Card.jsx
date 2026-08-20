import { cn } from '../../lib/cn.js';

const paddingClasses = {
  none: '',
  sm: 'p-md',
  md: 'p-lg',
  lg: 'p-xl',
};

export default function Card({ children, padding = 'md', className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={cn('mcss-card bg-surface-container-lowest border border-outline/10 rounded-lg shadow-sm transition-all duration-300', paddingClasses[padding], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
