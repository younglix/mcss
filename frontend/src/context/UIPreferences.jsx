import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const UIPreferencesContext = createContext(null);

const THEME_KEY = 'mcss-theme';
const FOCUS_KEY = 'mcss-focus-mode';

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode);
    localStorage.setItem(FOCUS_KEY, String(focusMode));
  }, [focusMode]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const toggleFocusMode = useCallback(() => setFocusMode((v) => !v), []);

  return (
    <UIPreferencesContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, focusMode, toggleFocusMode }}>
      {children}
    </UIPreferencesContext.Provider>
  );
}

export function useUIPreferences() {
  const ctx = useContext(UIPreferencesContext);
  if (!ctx) throw new Error('useUIPreferences must be used within UIPreferencesProvider');
  return ctx;
}
