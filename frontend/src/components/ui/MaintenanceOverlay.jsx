import { useEffect, useState } from 'react';

export default function MaintenanceOverlay() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handler = (e) => setMessage(e.detail?.message || 'The system is currently under maintenance. Please check back soon.');
    window.addEventListener('mcss:maintenance', handler);
    return () => window.removeEventListener('mcss:maintenance', handler);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-container-lowest p-lg">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-md">
        <span className="material-symbols-outlined text-6xl text-primary">build</span>
        <h1 className="font-headline-lg text-headline-md text-on-surface">Under Maintenance</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-md font-label-md text-label-md px-lg py-sm rounded bg-primary text-on-primary hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
