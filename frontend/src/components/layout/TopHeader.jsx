import { Link } from 'react-router-dom';
import IconButton from '../ui/IconButton.jsx';
import SearchBox from './SearchBox.jsx';
import ProfileMenu from './ProfileMenu.jsx';

const DEFAULT_LOGO = '/mcss-logo.png';

/**
 * Minimal top bar per the "Institutional Heritage" reference: wordmark,
 * search, notifications, account menu. Search and the account menu read
 * portalId directly (nav items, destinations) rather than being handed
 * pre-built props, since every portal needs the same two behaviors. Theme
 * and focus mode live inside the account menu only now, not as separate
 * icons here.
 */
export default function TopHeader({ wordmark, logoUrl, homePath = '/', portalId, notificationCount = 0 }) {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-outline-variant h-16 flex items-center px-md sm:px-gutter">
      <div className="flex items-center justify-between w-full max-w-container-max mx-auto">
        <Link to={homePath} className="flex items-center gap-sm min-w-0">
          <img src={logoUrl || DEFAULT_LOGO} alt="" className="w-9 h-9 object-contain shrink-0" />
          <span className="font-headline-md text-headline-sm sm:text-headline-md text-primary font-bold truncate">{wordmark}</span>
        </Link>
        <div className="flex items-center gap-xs shrink-0">
          <SearchBox portalId={portalId} />
          <IconButton icon="notifications" label="Notifications" badge={notificationCount > 0} />
          <ProfileMenu portalId={portalId} />
        </div>
      </div>
    </header>
  );
}
