export default function Drawer({ open, onClose, title, children, footer }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-nav/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-96 bg-surface-container-lowest shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-lg border-b border-outline/10 flex justify-between items-center bg-nav text-on-nav shrink-0">
          <h3 className="font-headline-md text-headline-md">{title}</h3>
          <button className="hover:rotate-90 transition-transform" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-lg">{children}</div>
        {footer && <div className="p-lg bg-surface-container border-t border-outline/10 flex gap-md shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
