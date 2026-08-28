import { useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api.js';

/** Upload-based counterpart to FormField's plain "paste a URL" text input —
 * picks a local image, uploads it via AssetUploadView, and reports the
 * resulting URL back through onChange exactly like a text field would. */
export default function ImageUploadField({ label, value, onChange, hint }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.post('/settings/upload-image', formData);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload this image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="font-label-md text-label-md text-on-surface mb-xs block">{label}</label>
      <div className="flex items-center gap-md">
        <div className="w-16 h-16 rounded border border-outline/20 bg-surface-container-low flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="material-symbols-outlined text-outline">image</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="mcss-field px-md py-sm font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : value ? 'Replace Image' : 'Upload Image'}
            </button>
            {value && !uploading && (
              <button type="button" onClick={() => onChange('')} className="font-label-sm text-label-sm text-error hover:underline">
                Remove
              </button>
            )}
          </div>
          {hint && !error && <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{hint}</p>}
          {error && <p className="font-label-sm text-label-sm text-error mt-1">{error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
