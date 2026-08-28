import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortal } from '../../config/portals.js';
import IconButton from '../ui/IconButton.jsx';

/**
 * Lightweight nav search: type a word, get the matching pages in this
 * portal's own nav (label match, e.g. "result" -> Results). Deliberately
 * does not search any data/records — it's a fast way to a page, not a
 * cross-entity search engine.
 */
// Some portals (Super Admin, Admin) group sidebarNav into sections with a
// `children` array instead of a flat list of leaf items — flatten either
// shape into one searchable list of real, navigable pages.
function flattenNavItems(navList) {
  const leaves = [];
  for (const item of navList || []) {
    if (item.children) leaves.push(...flattenNavItems(item.children));
    else if (item.path) leaves.push(item);
  }
  return leaves;
}

export default function SearchBox({ portalId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const items = portalId ? flattenNavItems(getPortal(portalId).sidebarNav).filter((item) => item.status === 'active') : [];
  const matches = query.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    function onEscape(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onEscape);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const goTo = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div className="relative" ref={containerRef}>
      <IconButton icon="search" label="Search" onClick={() => setOpen((v) => !v)} />
      {open && (
        // Full-screen sheet below sm: (a floating panel anchored to a
        // header icon has no good position on a narrow viewport); an
        // anchored dropdown at sm: and up, same as before.
        <div className="fixed inset-0 z-40 sm:absolute sm:inset-auto sm:right-0 sm:mt-sm sm:w-80 bg-surface-container-lowest border-outline/10 sm:border rounded-none sm:rounded-lg shadow-lg overflow-hidden flex flex-col sm:block">
          <div className="p-md sm:p-sm border-b border-outline/10 flex items-center gap-sm shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this portal's pages…"
              className="mcss-field w-full px-md"
            />
            <button type="button" onClick={() => { setOpen(false); setQuery(''); }} aria-label="Close search" className="sm:hidden p-2 text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 sm:max-h-80 overflow-y-auto py-xs">
            {matches.length === 0 ? (
              <p className="px-md py-md font-body-sm text-body-sm text-on-surface-variant">No matching pages.</p>
            ) : (
              matches.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(item.path)}
                  className="w-full flex items-center gap-sm px-md py-md sm:py-sm text-left hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">{item.icon}</span>
                  <span className="font-body-md text-body-md text-on-surface">{item.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
