import { useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useDashboardData } from '../../pages/SuperAdmin/dashboard/useDashboardData.js';
import { api, ApiError } from '../../lib/api.js';

/** Compact "add more images to this spot" control — the shared building
 * block behind every placement in configuration.SiteMedia (login slider,
 * and here, each landing-page image spot). Deliberately small/inline (a
 * thumbnail strip + a "+" button) rather than a full manager page, since
 * this sits directly next to the existing single-image field it's
 * extending, not replacing: that field stays the first/base image, this
 * just lets the Super Admin add more on top of it. */
export default function SiteMediaManager({ placement, label = 'Additional Images' }) {
  const endpoint = useMemoEndpoint(placement);
  const { data, loading, reload } = useDashboardData(endpoint);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const images = [...(data?.images || [])].sort((a, b) => a.order - b.order);

  const handleAdd = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await api.post('/settings/upload-image', formData);
      await api.post('/config/site-media', { placement, media_type: 'image', url: uploaded.url });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add this image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/config/site-media/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {label}{!loading && images.length > 0 ? ` (${images.length})` : ''}
        </span>
      </div>
      <div className="flex items-center gap-xs flex-wrap">
        {images.map((img) => (
          <div key={img.id} className="relative w-12 h-12 rounded border border-outline/20 overflow-hidden group shrink-0">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setDeleteTarget(img)}
              className="absolute inset-0 bg-nav/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              aria-label="Remove image"
            >
              <span className="material-symbols-outlined text-on-nav text-[16px]">close</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-12 h-12 rounded border border-dashed border-outline/40 flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50 shrink-0"
          aria-label="Add another image"
        >
          <span className="material-symbols-outlined text-[20px]">{uploading ? 'hourglass_empty' : 'add'}</span>
        </button>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
        Rotates with the existing image above when there's more than one, using the transition set on the Login Page settings.
      </p>
      {error && <p className="font-label-sm text-label-sm text-error mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleAdd} className="hidden" />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove This Image?"
        message="It'll stop rotating in and won't be shown again."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// A stable endpoints object per placement — useDashboardData needs a
// referentially stable object, so this can't just be an inline literal at
// the call site (a fresh object every render would re-trigger the fetch
// effect forever).
const ENDPOINT_CACHE = new Map();
function useMemoEndpoint(placement) {
  if (!ENDPOINT_CACHE.has(placement)) {
    ENDPOINT_CACHE.set(placement, { images: `/config/site-media?placement=${placement}` });
  }
  return ENDPOINT_CACHE.get(placement);
}
