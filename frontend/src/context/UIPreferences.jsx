import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const UIPreferencesContext = createContext(null);

const THEME_KEY = 'mcss-theme';
const FOCUS_KEY = 'mcss-focus-mode';
const SIDEBAR_WIDTH_KEY = 'mcss-sidebar-width';
const SIDEBAR_COLLAPSED_KEY = 'mcss-sidebar-collapsed';

export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 420;
export const SIDEBAR_DEFAULT_WIDTH = 288; // matches the old fixed w-72
export const SIDEBAR_COLLAPSED_WIDTH = 76;

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialFocusMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FOCUS_KEY) === 'true';
}

function getInitialSidebarWidth() {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH;
  const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  if (stored >= SIDEBAR_MIN_WIDTH && stored <= SIDEBAR_MAX_WIDTH) return stored;
  return SIDEBAR_DEFAULT_WIDTH;
}

function getInitialSidebarCollapsed() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

/**
 * Single source of truth for theme + focus mode so every toggle button and
 * the cursor-glow effect agree on state, no matter where in the tree they
 * render. Applies `.dark` / `.focus-mode` on <html>; the actual re-theming
 * happens purely in CSS (style.css token overrides), so no component needs
 * to know which theme is active.
 */
export function UIPreferencesProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [focusMode, setFocusMode] = useState(getInitialFocusMode);
  const [sidebarWidth, setSidebarWidthState] = useState(getInitialSidebarWidth);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(getInitialSidebarCollapsed);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode);
    localStorage.setItem(FOCUS_KEY, String(focusMode));
  }, [focusMode]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const toggleFocusMode = useCallback(() => setFocusMode((v) => !v), []);
  const toggleSidebarCollapsed = useCallback(() => setSidebarCollapsedState((v) => !v), []);
  // Dragging the resize handle implicitly means "I want it open at this
  // width" — without this, dragging while collapsed would silently do
  // nothing (the collapsed rail ignores width) and confuse whoever's
  // dragging it.
  const setSidebarWidth = useCallback((width) => {
    const clamped = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
    setSidebarWidthState(clamped);
    setSidebarCollapsedState(false);
  }, []);

  return (
    <UIPreferencesContext.Provider
      value={{
        theme, isDark: theme === 'dark', toggleTheme,
        focusMode, toggleFocusMode,
        sidebarWidth, setSidebarWidth,
        sidebarCollapsed, toggleSidebarCollapsed,
      }}
    >
      {children}
    </UIPreferencesContext.Provider>
  );
}

export function useUIPreferences() {
  const ctx = useContext(UIPreferencesContext);
  if (!ctx) throw new Error('useUIPreferences must be used within UIPreferencesProvider');
  return ctx;
}
