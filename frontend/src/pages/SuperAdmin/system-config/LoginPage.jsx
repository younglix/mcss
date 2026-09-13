import { useMemo, useRef, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import SectionShell from './SectionShell.jsx';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { TRANSITION_STYLES } from '../../../components/public/LoginImageSlider.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { images: '/config/site-media?placement=login_slider', settings: '/settings/?group=login' };

export default function SuperAdminLoginPageSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);

  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])));
  }

  const images = [...(data?.images || [])].sort((a, b) => a.order - b.order);

  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await api.post('/settings/upload-image', formData);
      await api.post('/config/site-media', { placement: 'login_slider', media_type: 'image', url: uploaded.url });
      reload();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Could not add this image.');
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

  const move = async (image, direction) => {
    const idx = images.findIndex((i) => i.id === image.id);
    const swapWith = images[idx + direction];
    if (!swapWith) return;
    setReorderingId(image.id);
    try {
      await Promise.all([
        api.patch(`/config/site-media/${image.id}`, { order: swapWith.order }),
        api.patch(`/config/site-media/${swapWith.id}`, { order: image.order }),
      ]);
      reload();
    } finally {
      setReorderingId(null);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await api.put('/settings/bulk', Object.entries(values).map(([key, value]) => ({ key, value })));
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell loading={loading} error={error} onReload={reload}>
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-xs">Desktop Slider Images</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
              Shown on the login page's desktop panel, replacing the plain background. Works with any number of
              images — none shows the plain background as before, one shows statically, more than one rotates
              using the transition below.
            </p>

            {uploadError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{uploadError}</p>}

            {images.length === 0 ? (
              <EmptyState icon="image" text="No images uploaded yet — the login page uses its default background." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-md mb-md">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative group border border-outline/10 rounded-lg overflow-hidden">
                    <img src={img.url} alt="" className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 bg-nav/0 group-hover:bg-nav/50 transition-colors flex items-center justify-center gap-xs opacity-0 group-hover:opacity-100">
                      <button
                        type="button" onClick={() => move(img, -1)} disabled={idx === 0 || reorderingId}
                        className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center disabled:opacity-30"
                        aria-label="Move earlier"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      </button>
                      <button
                        type="button" onClick={() => setDeleteTarget(img)}
                        className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center"
                        aria-label="Remove"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      <button
                        type="button" onClick={() => move(img, 1)} disabled={idx === images.length - 1 || reorderingId}
                        className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center disabled:opacity-30"
                        aria-label="Move later"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" variant="secondary" iconLeft="add_photo_alternate" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Add Image'}
            </Button>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
          </Card>

          <Card padding="lg" className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-md">Transition</h2>
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">Saved.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-md">
              <FormField
                field={{ key: 'login.transition_style', id: 'login_transition_style', label: 'Transition Style', type: 'select', options: TRANSITION_STYLES }}
                value={values['login.transition_style']}
                onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, 'login.transition_style': v })); }}
              />
              <FormField
                field={{ key: 'login.transition_duration', id: 'login_transition_duration', label: 'Seconds per Image', type: 'number' }}
                value={values['login.transition_duration']}
                onChange={(v) => { setSaved(false); setValues((p) => ({ ...p, 'login.transition_duration': v })); }}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove This Image?"
        message="It'll no longer appear in the login page slider."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SectionShell>
  );
}
