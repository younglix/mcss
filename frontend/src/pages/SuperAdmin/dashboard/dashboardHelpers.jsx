export function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(isoString).toLocaleDateString();
}

export function metricValue(metric) {
  if (!metric || !metric.available) return '—';
  return metric.value.toLocaleString();
}

export function metricHelper(metric) {
  return metric && !metric.available ? 'Module not yet available' : undefined;
}

export function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-sm py-xl text-center">
      <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl">{icon}</span>
      <p className="font-body-md text-body-md text-on-surface-variant">{text}</p>
    </div>
  );
}
