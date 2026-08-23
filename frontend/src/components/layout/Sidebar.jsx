import NavTree from './NavTree.jsx';

export default function Sidebar({ items, brand, onSignOut }) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-20 w-72 bg-nav text-on-nav py-lg shadow-[4px_0_24px_rgba(0,0,0,0.15)] overflow-y-auto">
      <div className="px-lg mb-lg shrink-0">
        <p className="font-label-md text-label-md font-bold">{brand?.wordmark}</p>
        <p className="text-label-xs uppercase tracking-widest opacity-70 mt-1">{brand?.tagline || 'Academic Excellence'}</p>
      </div>

      <nav className="flex-1 px-sm">
        <NavTree items={items} />
      </nav>

      {brand?.motto && (
        <div className="px-md mb-lg shrink-0">
          <div className="bg-on-nav/5 p-md rounded-md border border-on-nav/10">
            <p className="text-on-nav/80 text-sm italic">&ldquo;{brand.motto}&rdquo;</p>
            {brand.mottoNote && <p className="text-on-nav text-xs mt-xs opacity-50">{brand.mottoNote}</p>}
          </div>
        </div>
      )}

      <div className="px-md pt-md mt-auto border-t border-on-nav/10 shrink-0">
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
