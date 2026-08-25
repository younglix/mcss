import Button from './Button.jsx';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', danger = true, loading, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
      <div className="absolute inset-0 bg-nav/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-surface-container-lowest rounded-lg shadow-xl p-lg">
        <h3 className="font-headline-md text-headline-sm text-on-surface mb-xs">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{message}</p>
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className={danger ? 'bg-error text-on-error hover:opacity-90' : ''}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
