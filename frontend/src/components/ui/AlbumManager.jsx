import { useMemo, useRef, useState } from 'react';
import Button from './Button.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useDashboardData } from '../../pages/SuperAdmin/dashboard/useDashboardData.js';
import { isEmbeddableVideoUrl } from '../../lib/videoEmbed.js';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { items: '/config/site-media?placement=album' };

/** School Album manager — unlimited SiteMedia items (placement=album),
 * images and videos both. Images upload like every other image field in
 * this app; videos are added by URL (a direct .mp4 link, or a YouTube/
 * Vimeo link — see lib/videoEmbed.js) rather than uploaded as files,
 * since nothing in this app handles large raw video uploads yet and nothing
 * in this request asked for that infrastructure specifically — a School
 * Album is exactly the kind of thing schools already host clips for on
 * YouTube anyway. */
export default function AlbumManager() {
  const { data, loading, reload } = useDashboardData(ENDPOINTS);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(() => [...(data?.items || [])].sort((a, b) => a.order - b.order), [data]);

  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await api.post('/settings/upload-image', formData);
      await api.post('/config/site-media', { placement: 'album', media_type: 'image', url: uploaded.url });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add this image.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return;
    setError('');
    setAddingVideo(true);
    try {
      await api.post('/config/site-media', { placement: 'album', media_type: 'video', url: videoUrl.trim() });
      setVideoUrl('');
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add this video.');
    } finally {
      setAddingVideo(false);
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
      <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide mb-sm">
        School Album {!loading && items.length > 0 ? `(${items.length})` : ''}
      </h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
        Shown on the dedicated Album page, linked from the Gallery section below. Unlimited items, images and videos.
      </p>

      {error && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{error}</p>}

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-sm mb-md">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-outline/10 group bg-surface-container-low">
              {item.media_type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">play_circle</span>
                </div>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="absolute inset-0 bg-nav/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Remove"
              >
                <span className="material-symbols-outlined text-on-nav text-[20px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-sm">
        <Button type="button" variant="secondary" size="sm" iconLeft="add_photo_alternate" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Add Image'}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleAddImage} className="hidden" />

        {/* A plain div, not a <form> — AlbumManager always renders inside
            Website.jsx's own page-wide <form>, and HTML doesn't allow
            nested forms (silently breaks submit handling in the browser). */}
        <div className="flex gap-sm flex-1">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVideo(); } }}
            placeholder="Paste a video URL (YouTube, Vimeo, or a direct .mp4 link)"
            className="mcss-field px-md flex-1 min-w-0"
          />
          <Button type="button" variant="secondary" size="sm" iconLeft="video_call" onClick={handleAddVideo} disabled={addingVideo || !videoUrl.trim()}>
            {addingVideo ? 'Adding…' : 'Add Video'}
          </Button>
        </div>
      </div>
      {videoUrl && !isEmbeddableVideoUrl(videoUrl) && !videoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) && (
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
          This doesn't look like a YouTube/Vimeo link or a direct video file — it'll still be saved, but may not play correctly.
        </p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove This Item?"
        message="It'll no longer appear in the School Album."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
