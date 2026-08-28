import { useCallback, useEffect, useRef, useState } from 'react';
import NavTree from './NavTree.jsx';
import { useUIPreferences, SIDEBAR_COLLAPSED_WIDTH } from '../../context/UIPreferences.jsx';

export default function Sidebar({ items, brand, onSignOut }) {
  const { sidebarWidth, setSidebarWidth, sidebarCollapsed, toggleSidebarCollapsed } = useUIPreferences();
  const [dragging, setDragging] = useState(false);
  const dragState = useRef(null);

  const width = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth;

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current) return;
    setSidebarWidth(dragState.current.startWidth + (e.clientX - dragState.current.startX));
  }, [setSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    dragState.current = null;
    setDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const startDrag = (e) => {
    dragState.current = { startX: e.clientX, startWidth: sidebarWidth };
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <aside
      style={{ width }}
      className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-20 bg-nav text-on-nav py-lg shadow-[4px_0_24px_rgba(0,0,0,0.15)] overflow-y-auto relative ${
        dragging ? '' : 'transition-[width] duration-200 ease-out'
      }`}
    >
      <div className={`mb-lg shrink-0 ${sidebarCollapsed ? 'px-sm text-center' : 'px-lg'}`}>
        {sidebarCollapsed ? (
          <span className="material-symbols-outlined text-2xl" title={brand?.wordmark}>school</span>
        ) : (
          <>
            <p className="font-label-md text-label-md font-bold truncate">{brand?.wordmark}</p>
            <p className="text-label-xs uppercase tracking-widest opacity-70 mt-1 truncate">{brand?.tagline || 'Academic Excellence'}</p>
          </>
        )}
      </div>

      <nav className="flex-1 px-sm">
        <NavTree items={items} collapsed={sidebarCollapsed} />
      </nav>

      {brand?.motto && !sidebarCollapsed && (
        <div className="px-md mb-lg shrink-0">
          <div className="bg-on-nav/5 p-md rounded-md border border-on-nav/10">
            <p className="text-on-nav/80 text-sm italic">&ldquo;{brand.motto}&rdquo;</p>
            {brand.mottoNote && <p className="text-on-nav text-xs mt-xs opacity-50">{brand.mottoNote}</p>}
          </div>
        </div>
      )}

      <div className={`pt-md mt-auto border-t border-on-nav/10 shrink-0 ${sidebarCollapsed ? 'px-sm' : 'px-md'}`}>
        <button
          type="button"
          onClick={onSignOut}
          title={sidebarCollapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-sm text-on-nav/60 hover:text-on-nav transition-colors py-sm w-full ${sidebarCollapsed ? 'justify-center px-0' : 'px-md'}`}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {!sidebarCollapsed && <span className="font-label-md text-label-md">Sign Out</span>}
        </button>
      </div>

      {!sidebarCollapsed && (
        <div
          onMouseDown={startDrag}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />
      )}

      <button
        type="button"
        onClick={toggleSidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-lg -right-3 w-6 h-6 rounded-full bg-nav border border-on-nav/20 shadow-md flex items-center justify-center text-on-nav/80 hover:text-on-nav hover:border-on-nav/40 transition-colors z-10"
      >
        <span className="material-symbols-outlined text-[16px]">{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}</span>
      </button>
    </aside>
  );
}
