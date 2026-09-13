import { useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api.js';

/** Upload-based counterpart to FormField's plain text input, for the
 * 'attachment' custom-field type — picks a local file, uploads it via the
 * one public (unauthenticated-friendly) upload endpoint in the app, and
 * reports the result back through onChange as {url, file_name} (storage
 * uses a UUID-based filename, so the original name has to travel with the
 * value itself to ever be shown again — not derivable from the URL). See
 * ImageUploadField for the same pattern applied to images specifically
 * (branding logos, upload-image endpoint) — this one is for documents
 * (PDF/DOC/DOCX) as well as images, and works whether or not the caller is
 * logged in, since custom fields also render on the public
 * Apply/Staff-registration forms. */
export default function AttachmentUploadField({ label, required, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Accepts either the {url, file_name} shape this component saves, or a
  // bare URL string (older data, or a value set some other way) as a
  // fallback so it still renders something sensible either way.
  const url = value && typeof value === 'object' ? value.url : value;
  const displayName = value && typeof value === 'object' && value.file_name
    ? value.file_name
    : (url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : '');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.post('/custom-fields/attachments/upload', formData);
      onChange({ url: result.url, file_name: result.file_name });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload this file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="font-label-md text-label-md text-on-surface mb-xs block">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <div className="flex items-center gap-sm flex-wrap">
        {url && !uploading && (
          <a
            href={url} target="_blank" rel="noreferrer"
            className="flex items-center gap-xs mcss-field px-md py-sm font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors max-w-60 truncate"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">description</span>
            <span className="truncate">{displayName}</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mcss-field px-md py-sm font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : url ? 'Replace File' : 'Upload File'}
        </button>
        {url && !uploading && (
          <button type="button" onClick={() => onChange(null)} className="font-label-sm text-label-sm text-error hover:underline">
            Remove
          </button>
        )}
      </div>
      {!error && <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">PDF, JPG, PNG, DOC, or DOCX — up to 10MB.</p>}
      {error && <p className="font-label-sm text-label-sm text-error mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFile} className="hidden" />
    </div>
  );
}
