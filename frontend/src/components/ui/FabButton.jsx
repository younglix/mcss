export default function FabButton({ icon, label, onClick, tone = 'primary' }) {
  const toneClasses = tone === 'tertiary' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary text-on-primary';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`fixed bottom-24 lg:bottom-lg right-lg w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40 ${toneClasses}`}
    >
      <span className="material-symbols-outlined text-[26px]">{icon}</span>
    </button>
  );
}
