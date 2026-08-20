import Avatar from '../ui/Avatar.jsx';

export default function ChildSwitcher({ children, activeId, onSelect, onAdd }) {
  return (
    <div className="flex items-center gap-md bg-surface-container-high p-xs rounded self-start">
      <p className="font-label-md text-label-md text-primary px-sm hidden sm:block">Active Profile:</p>
      <div className="flex gap-xs">
        {children.map((child) => {
          const isActive = child.id === activeId;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect?.(child.id)}
              className={`flex items-center gap-sm px-md py-xs rounded-full transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border border-outline/20 hover:bg-surface-container-low'
              }`}
            >
              <Avatar src={child.avatarUrl} alt={child.name} size="sm" className="w-6 h-6" />
              <span className="font-label-md text-label-md">{child.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add child"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-lowest border border-outline/20 text-primary hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>
    </div>
  );
}
