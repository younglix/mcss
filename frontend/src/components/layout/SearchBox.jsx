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
        <div className="absolute right-0 mt-sm w-80 max-w-[90vw] bg-surface-container-lowest border border-outline/10 rounded-lg shadow-lg z-40 overflow-hidden">
          <div className="p-sm border-b border-outline/10">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this portal's pages…"
              className="mcss-field w-full px-md"
            />
          </div>
          <div className="max-h-80 overflow-y-auto py-xs">
            {matches.length === 0 ? (
              <p className="px-md py-md font-body-sm text-body-sm text-on-surface-variant">No matching pages.</p>
            ) : (
              matches.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(item.path)}
                  className="w-full flex items-center gap-sm px-md py-sm text-left hover:bg-surface-container-low transition-colors"
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
