import Avatar from './Avatar.jsx';
import Button from './Button.jsx';

/**
 * Announcement/message banner with dismiss/read-style actions
 * (e.g. Parent Dashboard's "New Message from Principal" strip).
 * Generic enough to reuse across portals.
 */
export default function NotificationStrip({ avatarUrl, avatarAlt = '', title, message, actions = [] }) {
  return (
    <div className="bg-surface-container-lowest border border-outline/10 rounded-lg p-md flex flex-col md:flex-row items-center justify-between gap-md">
      <div className="flex items-center gap-md">
        <Avatar src={avatarUrl} alt={avatarAlt} size="lg" />
        <div>
          <p className="font-label-md text-label-md text-primary">{title}</p>
          <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex gap-sm shrink-0">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant || 'secondary'} size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
