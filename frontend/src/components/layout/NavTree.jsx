import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';

function PlannedItem({ item, indent, collapsed }) {
  return (
    <span
      className={`flex items-start justify-between gap-sm px-md py-sm rounded text-on-nav/40 cursor-not-allowed ${indent ? 'ml-lg' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? `${item.label} (Coming soon)` : 'Coming soon'}
    >
      <span className="flex items-start gap-sm min-w-0">
        <span className="material-symbols-outlined text-[20px] shrink-0 leading-6">{item.icon}</span>
        {!collapsed && <span className="font-label-md text-label-md leading-tight py-0.5">{item.label}</span>}
      </span>
      {!collapsed && <span className="text-label-xs uppercase tracking-wide border border-on-nav/20 rounded-full px-1.5 py-0.5 shrink-0 mt-0.5">Soon</span>}
    </span>
  );
}

function ActiveLink({ item, indent, onNavigate, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-start gap-sm px-md py-sm rounded border-l-4 transition-all ${indent ? 'ml-lg' : ''} ${collapsed ? 'justify-center px-0 border-l-0' : ''} ${
          isActive
            ? `bg-on-nav/10 text-on-nav font-bold ${collapsed ? '' : 'border-tertiary-container'}`
            : 'border-transparent text-on-nav/70 hover:bg-on-nav/5 hover:text-on-nav'
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px] shrink-0 leading-6">{item.icon}</span>
      {!collapsed && <span className="font-label-md text-label-md leading-tight py-0.5">{item.label}</span>}
    </NavLink>
  );
}

function NavItem({ item, indent, onNavigate, collapsed }) {
  return item.status === 'planned'
    ? <PlannedItem item={item} indent={indent} collapsed={collapsed} />
    : <ActiveLink item={item} indent={indent} onNavigate={onNavigate} collapsed={collapsed} />;
}

/** Collapsed-rail rendering of a grouped item: icon-only trigger, its
 * children fly out in a small popover on hover/focus so a section with
 * sub-pages stays reachable without permanently widening the rail.
 * The popover is portaled to document.body and positioned from the
 * trigger's real screen coordinates — the rail scrolls vertically
 * (overflow-y-auto), and per the CSS overflow spec a non-visible
 * overflow-y forces overflow-x to act as "auto" too, so any popover
 * left inline in the DOM would get clipped at the rail's right edge. */
function CollapsedGroup({ item, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);

  const show = () => {
    clearTimeout(closeTimer.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.right + 4 });
    }
    setOpen(true);
  };
  const scheduleHide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div ref={triggerRef} onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        type="button"
        title={item.label}
        onFocus={show}
        onBlur={scheduleHide}
        className="w-full flex items-center justify-center px-0 py-sm rounded text-on-nav/80 hover:bg-on-nav/5 hover:text-on-nav transition-all"
      >
        <span className="material-symbols-outlined text-[20px] shrink-0 leading-6">{item.icon}</span>
      </button>
      {open && coords && createPortal(
        <div
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
          className="w-56 bg-nav border border-on-nav/15 rounded-lg shadow-xl z-50 py-xs"
        >
          <p className="px-md py-xs font-label-sm text-label-sm font-bold text-on-nav/60 uppercase tracking-wide">{item.label}</p>
          {item.children.map((child) => (
            <NavItem key={child.key} item={child} onNavigate={onNavigate} />
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

/**
 * Shared collapsible section + child-link renderer for portal navigation.
 * Used by the desktop Sidebar and the mobile "More" overflow drawer so
 * expand/collapse and active-state behavior never drift between them.
 * `collapsed` is the desktop rail's icon-only mode (distinct from a
 * section's own open/shut state, which stays independent either way).
 */
export default function NavTree({ items, onNavigate, collapsed = false }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => new Set());

  useEffect(() => {
    const activeGroup = items.find(
      (item) => item.children?.some((child) => child.path && child.path !== '/' && location.pathname === child.path),
    );
    if (activeGroup) {
      setExpanded((prev) => (prev.has(activeGroup.key) ? prev : new Set(prev).add(activeGroup.key)));
    }
  }, [location.pathname, items]);

  const toggleGroup = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-xs">
      {items.map((item) => {
        if (!item.children) {
          return <NavItem key={item.key} item={item} onNavigate={onNavigate} collapsed={collapsed} />;
        }

        if (collapsed) {
          return <CollapsedGroup key={item.key} item={item} onNavigate={onNavigate} />;
        }

        const isOpen = expanded.has(item.key);
        return (
          <div key={item.key}>
            <button
              type="button"
              onClick={() => toggleGroup(item.key)}
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-sm px-md py-sm rounded text-on-nav/80 hover:bg-on-nav/5 hover:text-on-nav transition-all"
            >
              <span className="flex items-start gap-sm min-w-0">
                <span className="material-symbols-outlined text-[20px] shrink-0 leading-6">{item.icon}</span>
                <span className="font-label-md text-label-md font-bold leading-tight py-0.5">{item.label}</span>
              </span>
              <span
                className="material-symbols-outlined text-[18px] shrink-0 transition-transform duration-200 mt-0.5"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-xs mt-xs mb-xs border-l border-on-nav/10 ml-md">
                {item.children.map((child) => (
                  <NavItem key={child.key} item={child} indent onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
