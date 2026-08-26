import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENTITY_TABS = [
  { key: 'student', label: 'Student' },
  { key: 'staff', label: 'Staff' },
];

const TYPE_LABELS = {
  text: 'Text', textarea: 'Paragraph', number: 'Number', date: 'Date', select: 'Dropdown', checkbox: 'Yes/No',
};

function slugify(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

const emptyForm = { label: '', key: '', field_type: 'text', options: '', required: false, order: 0 };

export default function SuperAdminFormsCustomFields() {
  const [entity, setEntity] = useState('student');
  const endpoints = useMemo(() => ({ fields: `/custom-fields/?entity=${entity}` }), [entity]);
  const { data, loading, error, reload } = useDashboardData(endpoints);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fields = data?.fields || [];

  const openCreate = () => {
    setEditingField(null);
    setFormValues(emptyForm);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (field) => {
    setEditingField(field);
    setFormValues({
      label: field.label, key: field.key, field_type: field.field_type,
      options: (field.options || []).join(', '), required: field.required, order: field.order,
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleLabelChange = (v) => {
    setFormValues((prev) => ({
      ...prev, label: v,
      key: !editingField && (prev.key === '' || prev.key === slugify(prev.label)) ? slugify(v) : prev.key,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      const payload = {
        entity,
        label: formValues.label,
        key: formValues.key,
        field_type: formValues.field_type,
        options: formValues.field_type === 'select'
          ? formValues.options.split(',').map((o) => o.trim()).filter(Boolean)
          : [],
        required: !!formValues.required,
        order: Number(formValues.order) || 0,
      };
      if (editingField) {
        await api.patch(`/custom-fields/${editingField.id}`, payload);
      } else {
        await api.post('/custom-fields/', payload);
      }
      setDrawerOpen(false);
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.errors && typeof err.errors === 'object') {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ __all__: err.message || 'Something went wrong.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (field) => {
    try {
      await api.patch(`/custom-fields/${field.id}`, { is_active: !field.is_active });
      reload();
    } catch {
      // surfaced via the next reload's error state if it's a real outage
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/custom-fields/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setFormErrors({ __all__: err.message || 'Could not delete this field.' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const drawerFields = [
    { key: 'label', label: 'Field Label', type: 'text', required: true },
    { key: 'key', label: 'Machine Key', type: 'text', required: true, placeholder: 'e.g. blood_group' },
    {
      key: 'field_type', label: 'Field Type', type: 'select', required: true,
      options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    ...(formValues.field_type === 'select'
      ? [{ key: 'options', label: 'Options (comma-separated)', type: 'text', placeholder: 'A+, O+, B+, AB+' }]
      : []),
    { key: 'required', label: 'Required', type: 'checkbox' },
    { key: 'order', label: 'Display Order', type: 'number' },
  ];

  return (
    <DashboardPageShell
      pageTitle="Forms & Custom Fields"
      title="Forms & Custom Fields"
      subtitle="Add extra fields to Student and Staff records — they appear automatically in those forms."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-md mb-md">
            <div className="flex gap-xs">
              {ENTITY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setEntity(tab.key)}
                  className={`font-label-sm text-label-sm px-md py-2 rounded-full border transition-colors ${
                    entity === tab.key ? 'bg-primary text-on-primary border-primary' : 'border-outline/20 text-on-surface-variant'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button variant="primary" iconLeft="add" onClick={openCreate}>
              New Field
            </Button>
          </div>

          {formErrors.__all__ && <p className="font-label-md text-label-md text-error mb-md">{formErrors.__all__}</p>}

          <Card padding={fields.length ? 'none' : 'lg'}>
            {fields.length === 0 ? (
              <EmptyState icon="dynamic_form" text={`No custom fields defined for ${entity === 'student' ? 'Students' : 'Staff'} yet`} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Label</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Key</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Required</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Active</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {fields.map((field) => (
                      <tr key={field.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{field.label}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{field.key}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{TYPE_LABELS[field.field_type] || field.field_type}</td>
                        <td className="px-lg py-4">{field.required ? <Badge tone="secondary">Required</Badge> : <span className="text-outline">—</span>}</td>
                        <td className="px-lg py-4">
                          <button type="button" onClick={() => toggleActive(field)}>
                            <Badge tone={field.is_active ? 'success' : 'secondary'}>{field.is_active ? 'Active' : 'Inactive'}</Badge>
                          </button>
                        </td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => openEdit(field)} title="Edit" className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(field)} title="Delete" className="p-2 text-outline hover:text-error transition-colors">
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingField ? 'Edit Field' : `New ${entity === 'student' ? 'Student' : 'Staff'} Field`}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {drawerFields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={field.key === 'label' ? formValues.label : formValues[field.key]}
              onChange={(v) => (field.key === 'label' ? handleLabelChange(v) : setFormValues((prev) => ({ ...prev, [field.key]: v })))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingField ? 'Save Changes' : 'Add Field'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Field?"
        message={`This removes "${deleteTarget?.label}" and any values stored for it. This can't be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
