const steps = ['Introduction', 'Bio-Data', 'Documents', 'Review'];

export default function ApplyStepper({ current }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-surface-container -z-10" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-secondary -z-10 transition-all duration-500"
          style={{ width: `${((current - 1) / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((label, i) => {
          const step = i + 1;
          const state = step < current ? 'done' : step === current ? 'active' : 'upcoming';
          return (
            <div key={label} className="flex flex-col items-center gap-xs">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  state === 'done'
                    ? 'bg-secondary text-on-secondary'
                    : state === 'active'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-outline'
                }`}
              >
                {state === 'done' ? <span className="material-symbols-outlined text-body-md">check</span> : step}
              </div>
              <span className={`font-label-sm text-label-sm hidden sm:block ${state === 'upcoming' ? 'text-outline' : state === 'active' ? 'text-primary font-bold' : 'text-secondary'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
