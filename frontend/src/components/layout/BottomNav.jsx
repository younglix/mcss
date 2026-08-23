import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Drawer from '../ui/Drawer.jsx';
import NavTree from './NavTree.jsx';

/**
 * Plain full-width bottom bar (not the floating-pill-with-FAB pattern used
 * by older un-migrated screens), matching the "Institutional Heritage"
 * reference: active item gets a small rounded-square icon background.
 *
 * `fullNav` (a portal's complete sidebarNav, groups included) is optional —
 * pass it whenever an item has status: 'more' so tapping it can open a
 * drawer with the rest of the navigation instead of dead-ending.
 */
export default function BottomNav({ items, fullNav }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-container-lowest border-t border-outline-variant flex items-stretch justify-around px-xs pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          if (item.status === 'more') {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-sm text-on-surface-variant"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </span>
                <span className="font-label-sm text-label-xs">{item.label}</span>
              </button>
            );
          }

          if (item.status === 'planned') {
            return (
              <span
                key={item.key}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-sm text-on-surface-variant/40 cursor-not-allowed"
                title="Coming soon"
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-label-sm text-label-xs">{item.label}</span>
              </span>
            );
          }

          return (
            <NavLink
              key={item.key}
              to={item.path}
              end
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-sm text-on-surface-variant"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${
                      isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </span>
                  <span className={`font-label-sm text-label-xs ${isActive ? 'text-primary font-bold' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {fullNav && (
        <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
          <div className="bg-nav -m-lg p-lg min-h-full">
            <NavTree items={fullNav} onNavigate={() => setMoreOpen(false)} />
          </div>
        </Drawer>
      )}
    </>
  );
}
