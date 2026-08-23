import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function PlannedItem({ item, indent }) {
  return (
    <span
      className={`flex items-start justify-between gap-sm px-md py-sm rounded text-on-nav/40 cursor-not-allowed ${indent ? 'ml-lg' : ''}`}
      title="Coming soon"
    >
      <span className="flex items-start gap-sm min-w-0">
        <span className="material-symbols-outlined text-[20px] shrink-0 leading-6">{item.icon}</span>
        <span className="font-label-md text-label-md leading-tight py-0.5">{item.label}</span>
      </span>
      <span className="text-label-xs uppercase tracking-wide border border-on-nav/20 rounded-full px-1.5 py-0.5 shrink-0 mt-0.5">Soon</span>
    </span>
  );
}

function ActiveLink({ item, indent, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-start gap-sm px-md py-sm rounded border-l-4 transition-all ${indent ? 'ml-lg' : ''} ${
          isActive
            ? 'border-tertiary-container bg-on-nav/10 text-on-nav font-bold'
            : 'border-transparent text-on-nav/70 hover:bg-on-nav/5 hover:text-on-nav'
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px] shrink-0 leading-6">{item.icon}</span>
      <span className="font-label-md text-label-md leading-tight py-0.5">{item.label}</span>
    </NavLink>
  );
}

function NavItem({ item, indent, onNavigate }) {
  return item.status === 'planned' ? <PlannedItem item={item} indent={indent} /> : <ActiveLink item={item} indent={indent} onNavigate={onNavigate} />;
}

/**
 * Shared collapsible section + child-link renderer for portal navigation.
 * Used by the desktop Sidebar and the mobile "More" overflow drawer so
 * expand/collapse and active-state behavior never drift between them.
 */
export default function NavTree({ items, onNavigate }) {
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
          return <NavItem key={item.key} item={item} onNavigate={onNavigate} />;
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
