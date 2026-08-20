import { useUIPreferences } from '../../context/UIPreferences.jsx';

export default function PreferenceControls({ tone = 'default', className = '' }) {
  const { isDark, toggleTheme, focusMode, toggleFocusMode } = useUIPreferences();

  const baseToneClasses = tone === 'inverse' ? 'text-on-nav/80 hover:text-on-nav hover:bg-on-nav/10' : 'text-on-surface-variant hover:bg-surface-container-low';

  return (
    <div className={`flex items-center gap-xs ${className}`}>
      <button
        type="button"
        onClick={toggleFocusMode}
        aria-label="Toggle focus mode"
        aria-pressed={focusMode}
        title="Focus mode"
        className={`relative p-sm rounded-full min-h-11 min-w-11 flex items-center justify-center transition-all duration-300 ${
          focusMode ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(var(--color-primary-rgb),0.55)]' : baseToneClasses
        }`}
      >
        <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: focusMode ? 'scale(1.05)' : 'scale(1)' }}>
          center_focus_strong
        </span>
      </button>
      <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme" className={`relative p-sm rounded-full min-h-11 min-w-11 flex items-center justify-center transition-all duration-300 ${baseToneClasses}`}>
        <span
          className="material-symbols-outlined inline-block transition-transform duration-500 ease-out"
          style={{ transform: isDark ? 'rotate(-25deg) scale(1)' : 'rotate(0deg) scale(1)' }}
        >
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
    </div>
  );
}
