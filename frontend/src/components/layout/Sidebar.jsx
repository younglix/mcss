import { NavLink } from 'react-router-dom';

export default function Sidebar({ items, brand, onSignOut }) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-20 w-64 bg-nav text-on-nav py-lg shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
      <div className="px-lg mb-lg">
        <p className="font-label-md text-label-md font-bold">{brand?.wordmark}</p>
        <p className="text-label-xs uppercase tracking-widest opacity-70 mt-1">{brand?.tagline || 'Academic Excellence'}</p>
      </div>

      <nav className="flex-1 flex flex-col gap-xs px-sm">
        {items.map((item) =>
          item.status === 'planned' ? (
            <span
              key={item.key}
              className="flex items-center justify-between gap-sm px-md py-sm rounded text-on-nav/40 cursor-not-allowed"
              title="Coming soon"
            >
              <span className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-label-md text-label-md">{item.label}</span>
              </span>
              <span className="text-label-xs uppercase tracking-wide border border-on-nav/20 rounded-full px-1.5 py-0.5">Soon</span>
            </span>
          ) : (
            <NavLink
              key={item.key}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center gap-sm px-md py-sm rounded border-l-4 transition-all ${
                  isActive
                    ? 'border-tertiary-container bg-on-nav/10 text-on-nav font-bold'
                    : 'border-transparent text-on-nav/70 hover:bg-on-nav/5 hover:text-on-nav'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>

      {brand?.motto && (
        <div className="px-md mb-lg">
          <div className="bg-on-nav/5 p-md rounded-md border border-on-nav/10">
            <p className="text-on-nav/80 text-sm italic">&ldquo;{brand.motto}&rdquo;</p>
            {brand.mottoNote && <p className="text-on-nav text-xs mt-xs opacity-50">{brand.mottoNote}</p>}
          </div>
        </div>
      )}

      <div className="px-md pt-md mt-auto border-t border-on-nav/10">
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-sm text-on-nav/60 hover:text-on-nav transition-colors px-md py-sm w-full"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-md text-label-md">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
