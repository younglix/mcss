import { useEffect, useRef, useState } from 'react';
import { GOOGLE_FONTS, loadGoogleFonts } from '../../lib/fonts.js';

/** Searchable dropdown over a 100+ Google Font catalog, replacing a free-text
 * font name input — same outside-click/escape/mcss-field pattern as the
 * portal's SearchBox. Loads the currently selected font itself (so its own
 * button preview, and the label text below it, render in the real typeface
 * immediately) independent of whether the surrounding form has been saved —
 * Appearance.jsx's save handler is what commits it as the app-wide font via
 * applyTypographyOverrides, this is purely "make it visible while picking." */
export default function FontPicker({ id, label, hint, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) loadGoogleFonts([value]);
  }, [value]);

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

  const matches = query.trim()
    ? GOOGLE_FONTS.filter((f) => f.toLowerCase().includes(query.trim().toLowerCase()))
    : GOOGLE_FONTS;

  const select = (name) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  return (
    <div>
      {label && (
        <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          id={id}
          onClick={() => setOpen((v) => !v)}
          className="mcss-field w-full px-md flex items-center justify-between gap-sm text-left"
        >
          <span style={{ fontFamily: value ? `"${value}", sans-serif` : undefined }} className="truncate">
            {value || 'Select a font…'}
          </span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        {open && (
          <div className="absolute z-30 mt-xs w-full bg-surface-container-lowest border border-outline/10 rounded-lg shadow-lg overflow-hidden">
            <div className="p-sm border-b border-outline/10">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fonts…"
                className="mcss-field w-full px-md"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-xs">
              {matches.length === 0 ? (
                <p className="px-md py-md font-body-sm text-body-sm text-on-surface-variant">No matching fonts.</p>
              ) : (
                matches.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => select(name)}
                    className={`w-full text-left px-md py-sm hover:bg-surface-container-low transition-colors font-body-md text-body-md ${
                      name === value ? 'text-primary font-bold' : 'text-on-surface'
                    }`}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {hint && <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}
