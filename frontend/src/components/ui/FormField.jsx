const fieldClasses = 'mcss-field w-full px-md';

export default function FormField({ field, value, onChange, error }) {
  // `field.key` drives form state / API payload shape; `field.id` (falling
  // back to key) is the DOM id — kept separate so two forms that both have
  // a "name" field (e.g. Session + Term drawers, both mounted at once since
  // Drawer only hides via CSS) don't collide on duplicate DOM ids.
  const domId = field.id || field.key;

  const commonLabel = (
    <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor={domId}>
      {field.label}
      {field.required && <span className="text-error"> *</span>}
    </label>
  );

  let control;
  if (field.type === 'textarea') {
    control = (
      <textarea
        id={domId}
        className={`${fieldClasses} py-sm resize-none`}
        rows={field.rows || 3}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  } else if (field.type === 'select') {
    control = (
      <select id={domId} className={fieldClasses} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          Select…
        </option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-sm py-xs cursor-pointer" htmlFor={domId}>
        <input
          id={domId}
          type="checkbox"
          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="font-label-md text-label-md text-on-surface">{field.label}</span>
      </label>
    );
  } else {
    control = (
      <input
        id={domId}
        className={fieldClasses}
        type={field.type || 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(field.type === 'number' ? e.target.value.replace(/[^\d.]/g, '') : e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  return (
    <div>
      {commonLabel}
      {control}
      {error && <p className="font-label-sm text-label-sm text-error mt-xs">{error}</p>}
    </div>
  );
}
