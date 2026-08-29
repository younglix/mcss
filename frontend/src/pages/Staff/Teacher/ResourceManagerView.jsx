import { useMemo, useRef, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const LESSON_NOTE_CATEGORY = 'Lesson Note';
const OTHER_CATEGORIES = ['Past Question', 'Study Material', 'Other'];

function emptyForm(fixedCategory) {
  return { class_arm: '', title: '', description: '', category: fixedCategory || OTHER_CATEGORIES[0] };
}

/** Shared engine behind Lesson Notes and Resources / E-Learning — both are
 * "upload a file for one of my classes" against the same StudentResource-
 * backed endpoint, distinguished by category: Lesson Notes is pinned to a
 * single fixed category (both for listing and upload), while Resources /
 * E-Learning shows everything else and lets the uploader pick a category
 * from a small fixed set — so the two nav items stay genuinely different
 * without needing two near-identical models. */
export default function ResourceManagerView({ title, subtitle, fixedCategory, emptyIcon, emptyText }) {
  const ENDPOINTS = useMemo(
    () => ({
      resources: fixedCategory
        ? `/student-services/resources/teaching?category=${encodeURIComponent(fixedCategory)}`
        : '/student-services/resources/teaching',
      classes: '/academics/teaching/classes',
    }),
    [fixedCategory],
  );
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const resources = (data?.resources || []).filter((r) => fixedCategory || r.category !== LESSON_NOTE_CATEGORY);
  const classes = data?.classes || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(fixedCategory));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const openNew = () => {
    setForm(emptyForm(fixedCategory));
    setFile(null);
    setFormError('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    try {
      let fileUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploaded = await api.post('/student-services/resources/teaching/upload', formData);
        fileUrl = uploaded.url;
      }
      await api.post('/student-services/resources/teaching', { ...form, file_url: fileUrl });
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not upload this resource.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/student-services/resources/teaching/${id}`);
    reload();
  };

  return (
    <div className="space-y-lg sm:space-y-xl">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<Button variant="primary" iconLeft="upload" onClick={openNew}>Upload</Button>}
      />

      {error && (
        <Card padding="lg" className="border border-error/30 bg-error-container/10">
          <p className="font-body-md text-body-md text-on-surface">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
      ) : resources.length === 0 ? (
        <Card padding="lg"><EmptyState icon={emptyIcon} text={emptyText} /></Card>
      ) : (
        <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
          {resources.map((r) => (
            <Card key={r.id} padding="lg">
              <div className="flex items-start justify-between gap-sm">
                <div>
                  {!fixedCategory && r.category && <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{r.category}</p>}
                  <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{r.title}</h3>
                </div>
                <button type="button" onClick={() => handleDelete(r.id)} className="p-1 text-outline hover:text-error transition-colors shrink-0" aria-label="Remove">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              {r.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{r.description}</p>}
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{r.uploaded_by_name || 'You'} · {new Date(r.created_at).toLocaleDateString()}</p>
              {r.file_url && (
                <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs mt-md text-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open File
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`Upload — ${title}`}
        footer={(
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.class_arm || !form.title}>
            {saving ? 'Uploading…' : 'Upload'}
          </Button>
        )}
      >
        <div className="space-y-md">
          {formError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{formError}</p>}
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Class</label>
            <select value={form.class_arm} onChange={(e) => setForm((prev) => ({ ...prev, class_arm: e.target.value }))} className="mcss-field w-full px-md">
              <option value="">Select a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.school_class_name} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="mcss-field w-full px-md" />
          </div>
          {!fixedCategory && (
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Category</label>
              <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="mcss-field w-full px-md">
                {OTHER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="mcss-field w-full px-md py-sm resize-none" />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">File</label>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mcss-field w-full px-md py-sm text-left font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors">
              {file ? file.name : 'Choose a file…'}
            </button>
            <input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
