import { useMemo, useRef, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import FormField from '../../components/ui/FormField.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { documents: '/operations/hr/documents', staff: '/users/?user_type=staff' };

const CATEGORY_OPTIONS = [
  { value: 'contract', label: 'Contract' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'id', label: 'ID Document' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = { staff: '', title: '', category: 'other' };

export default function HRDocuments() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const documents = data?.documents || [];
  const staff = data?.staff || [];
  const staffOptions = staff.map((s) => ({ value: s.id, label: s.full_name }));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const openNew = () => {
    setValues(EMPTY_FORM);
    setFile(null);
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      let fileUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploaded = await api.post('/operations/hr/upload', formData);
        fileUrl = uploaded.url;
      }
      await api.post('/operations/hr/documents', { ...values, file_url: fileUrl });
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/operations/hr/documents/${id}`);
    reload();
  };

  return (
    <DashboardPageShell portalId="hr" pageTitle="Staff Documents" title="Staff Documents" subtitle="Document storage per employee — contracts, certificates, IDs, and more." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="upload" onClick={openNew}>Upload Document</Button>
          </div>
          <Card padding={documents.length ? 'none' : 'lg'}>
            {documents.length === 0 ? <EmptyState icon="folder_shared" text="No documents uploaded yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Title</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Category</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {documents.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{d.title}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{d.staff_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{d.category}</td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          {d.file_url && (
                            <a href={d.file_url} target="_blank" rel="noreferrer" title="Open" className="p-2 text-outline hover:text-primary transition-colors inline-block">
                              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                            </a>
                          )}
                          <button type="button" onClick={() => handleDelete(d.id)} title="Delete" className="p-2 text-outline hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Upload Staff Document"
        footer={<Button variant="primary" onClick={handleSubmit} disabled={saving || !values.staff || !values.title}>{saving ? 'Uploading…' : 'Upload'}</Button>}
      >
        <div className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField field={{ key: 'staff', id: 'doc_staff', label: 'Staff', type: 'select', required: true, options: staffOptions }} value={values.staff} onChange={(v) => setValues((p) => ({ ...p, staff: v }))} error={errors.staff?.[0]} />
          <FormField field={{ key: 'title', id: 'doc_title', label: 'Title', type: 'text', required: true }} value={values.title} onChange={(v) => setValues((p) => ({ ...p, title: v }))} error={errors.title?.[0]} />
          <FormField field={{ key: 'category', id: 'doc_category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS }} value={values.category} onChange={(v) => setValues((p) => ({ ...p, category: v }))} />
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">File</label>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mcss-field w-full px-md py-sm text-left font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors">
              {file ? file.name : 'Choose a file…'}
            </button>
            <input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          </div>
        </div>
      </Drawer>
    </DashboardPageShell>
  );
}
