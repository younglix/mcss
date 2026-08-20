import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import IconButton from '../ui/IconButton.jsx';

const logoUrl = '/mcss-logo.png';

/**
 * Minimal top bar per the "Institutional Heritage" reference: wordmark,
 * search, notifications, avatar. Deliberately omits the branch selector
 * and dark-mode toggle the older per-page headers carried.
 */
export default function TopHeader({
  wordmark,
  homePath = '/',
  onSearchClick,
  notificationCount = 0,
  avatarUrl,
  avatarAlt = 'Profile',
  avatarFallback,
}) {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-outline-variant h-16 flex items-center px-md sm:px-gutter">
      <div className="flex items-center justify-between w-full max-w-container-max mx-auto">
        <Link to={homePath} className="flex items-center gap-sm min-w-0">
          <img src={logoUrl} alt="" className="w-9 h-9 object-contain shrink-0" />
          <span className="font-headline-md text-headline-sm sm:text-headline-md text-primary font-bold truncate">{wordmark}</span>
        </Link>
        <div className="flex items-center gap-xs shrink-0">
          <IconButton icon="search" label="Search" onClick={onSearchClick} />
          <IconButton icon="notifications" label="Notifications" badge={notificationCount > 0} />
          <Avatar src={avatarUrl} alt={avatarAlt} fallbackInitials={avatarFallback} size="sm" className="ml-xs" />
        </div>
      </div>
    </header>
  );
}
