import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ImageUploadField from '../../../components/ui/ImageUploadField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/settings/?group=website' };

const SEO_FIELDS = [
  { key: 'website.meta_title', id: 'meta_title', label: 'Page Title', type: 'text', placeholder: 'Shown in browser tabs and search results' },
  { key: 'website.meta_description', id: 'meta_description', label: 'Meta Description', type: 'textarea', rows: 3 },
];

const SOCIAL_FIELDS = [
  { key: 'website.social_facebook', id: 'social_facebook', label: 'Facebook URL', type: 'text' },
  { key: 'website.social_twitter', id: 'social_twitter', label: 'X / Twitter URL', type: 'text' },
  { key: 'website.social_instagram', id: 'social_instagram', label: 'Instagram URL', type: 'text' },
];

const FOOTER_FIELDS = [
  { key: 'website.footer_text', id: 'footer_text', label: 'Footer Text', type: 'textarea', rows: 2 },
];

const BANNER_FIELDS = [
  { key: 'website.banner_text', id: 'banner_text', label: 'Banner Text', type: 'text' },
  { key: 'website.banner_cta', id: 'banner_cta', label: 'Button Label', type: 'text' },
];

const HERO_TEXT_FIELDS = [
  { key: 'website.hero_eyebrow', id: 'hero_eyebrow', label: 'Eyebrow', type: 'text' },
  { key: 'website.hero_title', id: 'hero_title', label: 'Title', type: 'text' },
  { key: 'website.hero_title_accent', id: 'hero_title_accent', label: 'Title (accent line)', type: 'text' },
  { key: 'website.hero_body', id: 'hero_body', label: 'Body', type: 'textarea', rows: 3 },
  { key: 'website.hero_stat_value', id: 'hero_stat_value', label: 'Stat Value', type: 'text', placeholder: 'e.g. 100%' },
  { key: 'website.hero_stat_label', id: 'hero_stat_label', label: 'Stat Label', type: 'text', placeholder: 'e.g. WAEC Success Rate' },
];

const ABOUT_TEXT_FIELDS = [
  { key: 'website.about_eyebrow', id: 'about_eyebrow', label: 'Eyebrow', type: 'text' },
  { key: 'website.about_title', id: 'about_title', label: 'Title', type: 'text' },
  { key: 'website.about_title_accent', id: 'about_title_accent', label: 'Title (accent line)', type: 'text' },
  { key: 'website.about_body', id: 'about_body', label: 'Body', type: 'textarea', rows: 3 },
];

const ACADEMICS_TEXT_FIELDS = [
  { key: 'website.academics_eyebrow', id: 'academics_eyebrow', label: 'Eyebrow', type: 'text' },
  { key: 'website.academics_title', id: 'academics_title', label: 'Title', type: 'text' },
];

const FEES_TEXT_FIELDS = [
  { key: 'website.fees_title', id: 'fees_title', label: 'Title', type: 'text' },
  { key: 'website.fees_title_accent', id: 'fees_title_accent', label: 'Title (accent line)', type: 'text' },
  { key: 'website.fees_body', id: 'fees_body', label: 'Body', type: 'textarea', rows: 3 },
];

const GALLERY_TEXT_FIELDS = [
  { key: 'website.gallery_title', id: 'gallery_title', label: 'Title', type: 'text' },
  { key: 'website.gallery_body', id: 'gallery_body', label: 'Body', type: 'textarea', rows: 2 },
];

function FieldGrid({ fields, values, update, cols = 1 }) {
  const colClass = cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : '';
  return (
    <div className={`grid grid-cols-1 ${colClass} gap-lg`}>
      {fields.map((field) => (
        <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => update(field.key, v)} />
      ))}
    </div>
  );
}

export default function SuperAdminWebsiteSettings() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  if (data && values === null) {
    setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])));
  }

  const update = (key, v) => {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const updateArrayItem = (key, index, field, v) => {
    setSaved(false);
    setValues((prev) => {
      const arr = [...(prev[key] || [])];
      arr[index] = { ...arr[index], [field]: v };
      return { ...prev, [key]: arr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const aboutPoints = values?.['website.about_points'] || [];
  const academicsPrograms = values?.['website.academics_programs'] || [];
  const galleryImages = values?.['website.gallery_images'] || [];

  return (
    <DashboardPageShell
      pageTitle="Website"
      title="Website"
      subtitle="The public landing page's full layout, plus SEO metadata, social links, and footer text."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && values && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-3xl flex flex-wrap items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              The school's name, logo, and contact details come from School Configuration — the landing page footer reads them live from there.
            </p>
            <div className="flex gap-sm">
              <Link to="/super-admin/configuration" className="font-label-sm text-label-sm text-primary hover:underline">School Configuration →</Link>
              <Link to="/super-admin/administration/website-cms" className="font-label-sm text-label-sm text-primary hover:underline">Site Announcements →</Link>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm max-w-3xl">{saveError}</p>}
            {saved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm max-w-3xl">Saved and live on the public site.</p>}

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Admissions Banner</h2>
              <div className="space-y-lg">
                <FormField
                  field={{ key: 'website.banner_enabled', id: 'banner_enabled', label: 'Show the banner', type: 'checkbox' }}
                  value={values['website.banner_enabled']}
                  onChange={(v) => update('website.banner_enabled', v)}
                />
                <FieldGrid fields={BANNER_FIELDS} values={values} update={update} cols={2} />
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Hero</h2>
              <div className="space-y-lg">
                <ImageUploadField label="Hero Image" value={values['website.hero_image']} onChange={(v) => update('website.hero_image', v)} />
                <FieldGrid fields={HERO_TEXT_FIELDS} values={values} update={update} cols={2} />
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">About</h2>
              <div className="space-y-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <ImageUploadField label="Image 1" value={values['website.about_image1']} onChange={(v) => update('website.about_image1', v)} />
                  <ImageUploadField label="Image 2" value={values['website.about_image2']} onChange={(v) => update('website.about_image2', v)} />
                </div>
                <FieldGrid fields={ABOUT_TEXT_FIELDS} values={values} update={update} cols={2} />
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide mb-sm">Highlight Points</h3>
                  <div className="space-y-md">
                    {aboutPoints.map((point, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_2.5fr] gap-sm p-md bg-surface-container-low rounded-lg">
                        <FormField field={{ key: 'icon', label: 'Icon Name', type: 'text' }} value={point.icon} onChange={(v) => updateArrayItem('website.about_points', i, 'icon', v)} />
                        <FormField field={{ key: 'title', label: 'Title', type: 'text' }} value={point.title} onChange={(v) => updateArrayItem('website.about_points', i, 'title', v)} />
                        <FormField field={{ key: 'body', label: 'Text', type: 'text' }} value={point.body} onChange={(v) => updateArrayItem('website.about_points', i, 'body', v)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Academics</h2>
              <div className="space-y-lg">
                <FieldGrid fields={ACADEMICS_TEXT_FIELDS} values={values} update={update} cols={2} />
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide mb-sm">Programs</h3>
                  <div className="space-y-md">
                    {academicsPrograms.map((program, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-sm p-md bg-surface-container-low rounded-lg">
                        <FormField field={{ key: 'icon', label: 'Icon Name', type: 'text' }} value={program.icon} onChange={(v) => updateArrayItem('website.academics_programs', i, 'icon', v)} />
                        <FormField field={{ key: 'grades', label: 'Grades', type: 'text' }} value={program.grades} onChange={(v) => updateArrayItem('website.academics_programs', i, 'grades', v)} />
                        <FormField field={{ key: 'name', label: 'Program Name', type: 'text' }} value={program.name} onChange={(v) => updateArrayItem('website.academics_programs', i, 'name', v)} />
                        <FormField field={{ key: 'tag', label: 'Tag', type: 'text' }} value={program.tag} onChange={(v) => updateArrayItem('website.academics_programs', i, 'tag', v)} />
                        <div className="md:col-span-2">
                          <FormField field={{ key: 'body', label: 'Description', type: 'textarea', rows: 2 }} value={program.body} onChange={(v) => updateArrayItem('website.academics_programs', i, 'body', v)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Fees</h2>
              <FieldGrid fields={FEES_TEXT_FIELDS} values={values} update={update} cols={2} />
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Gallery</h2>
              <div className="space-y-lg">
                <FieldGrid fields={GALLERY_TEXT_FIELDS} values={values} update={update} cols={2} />
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide mb-sm">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    {galleryImages.map((image, i) => (
                      <div key={i} className="p-md bg-surface-container-low rounded-lg space-y-md">
                        <ImageUploadField label={`Image ${i + 1}`} value={image.url} onChange={(v) => updateArrayItem('website.gallery_images', i, 'url', v)} />
                        <FormField field={{ key: 'label', label: 'Caption', type: 'text' }} value={image.label} onChange={(v) => updateArrayItem('website.gallery_images', i, 'label', v)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">SEO</h2>
              <FieldGrid fields={SEO_FIELDS} values={values} update={update} />
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Social Links</h2>
              <FieldGrid fields={SOCIAL_FIELDS} values={values} update={update} cols={2} />
            </Card>

            <Card padding="lg" className="max-w-3xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Footer</h2>
              <FieldGrid fields={FOOTER_FIELDS} values={values} update={update} />
            </Card>

            <div className="flex justify-end max-w-3xl">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      )}
    </DashboardPageShell>
  );
}
