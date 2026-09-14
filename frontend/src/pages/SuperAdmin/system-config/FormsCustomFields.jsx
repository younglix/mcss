import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import SectionShell from './SectionShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENTITY_TABS = [
  { key: 'student', label: 'Student' },
  { key: 'staff', label: 'Staff' },
  { key: 'parent', label: 'Parent' },
];
const ENTITY_LABEL = Object.fromEntries(ENTITY_TABS.map((t) => [t.key, t.label]));

const TYPE_LABELS = {
  text: 'Text', textarea: 'Paragraph', number: 'Number', date: 'Date', select: 'Dropdown', checkbox: 'Yes/No',
  attachment: 'Attachment',
};

// Field types FormField.jsx actually renders a placeholder on (select,
// checkbox and attachment don't have a free-text input to hint).
const PLACEHOLDER_TYPES = new Set(['text', 'textarea', 'number', 'date']);

const UNGROUPED = 'none';

function slugify(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

const emptyForm = { label: '', key: '', field_type: 'text', options: '', placeholder: '', group: UNGROUPED, required: false, order: 0, is_sensitive: false };
const emptyGroupForm = { name: '', order: 0 };

/** Requirement 9 — "view existing users with incomplete/newly added
 * fields." Read-only: adding a required field here immediately surfaces
 * every existing user who hasn't filled it in yet, with no re-registration
 * or migration step of any kind — they just show up in this list. */
function ProfileCompleteness({ entity }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setRows(null);
    setError('');
    api.get(`/custom-fields/completeness?entity=${entity}`)
      .then(setRows)
      .catch(() => setError('Could not load the completeness report.'));
  }, [entity]);

  return (
    <Card padding="lg" className="mt-lg">
      <h3 className="font-headline-md text-headline-sm text-on-surface mb-xs">Profile Completeness</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-md">
        {ENTITY_LABEL[entity]} accounts still missing a required field — including anyone whose account predates that
        field being added.
      </p>
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      {!error && rows === null && <p className="font-label-sm text-label-sm text-on-surface-variant">Loading…</p>}
      {!error && rows && rows.length === 0 && (
        <p className="font-label-sm text-label-sm text-secondary">Everyone has every required field filled in.</p>
      )}
      {!error && rows && rows.length > 0 && (
        <div className="space-y-xs">
          {rows.map((r) => (
            <div key={r.entity_id} className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-lg border border-outline/10">
              <span className="font-label-md text-label-md font-bold text-on-surface">{r.name}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Missing: {r.missing_fields.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FieldsTable({ fields, onEdit, onDelete, onToggleActive }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-175 text-left border-collapse">
        <thead>
          <tr className="bg-primary text-on-primary">
            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Label</th>
            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Key</th>
            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Placeholder</th>
            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Required</th>
            <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Sensitive</th>
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
              <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant italic">{field.placeholder || '—'}</td>
              <td className="px-lg py-4">{field.required ? <Badge tone="secondary">Required</Badge> : <span className="text-outline">—</span>}</td>
              <td className="px-lg py-4">{field.is_sensitive ? <Badge tone="warning">Masked</Badge> : <span className="text-outline">—</span>}</td>
              <td className="px-lg py-4">
                <button type="button" onClick={() => onToggleActive(field)}>
                  <Badge tone={field.is_active ? 'success' : 'secondary'}>{field.is_active ? 'Active' : 'Inactive'}</Badge>
                </button>
              </td>
              <td className="px-lg py-4 text-right whitespace-nowrap">
                <button type="button" onClick={() => onEdit(field)} title="Edit" className="p-2 text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button type="button" onClick={() => onDelete(field)} title="Delete" className="p-2 text-outline hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperAdminFormsCustomFields() {
  const [entity, setEntity] = useState('student');
  const endpoints = useMemo(() => ({
    fields: `/custom-fields/?entity=${entity}`,
    groups: `/custom-fields/groups?entity=${entity}`,
  }), [entity]);
  const { data, loading, error, reload } = useDashboardData(endpoints);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormValues, setGroupFormValues] = useState(emptyGroupForm);
  const [groupFormErrors, setGroupFormErrors] = useState({});
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const fields = data?.fields || [];
  const groups = data?.groups || [];

  const groupOptions = [
    { value: UNGROUPED, label: '— Ungrouped —' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  const sections = [
    ...groups.map((g) => ({ key: g.id, label: g.name, group: g, fields: fields.filter((f) => f.group === g.id) })),
    { key: UNGROUPED, label: 'Ungrouped', group: null, fields: fields.filter((f) => !f.group) },
  ].filter((section) => section.fields.length > 0 || section.group);

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
      options: (field.options || []).join(', '), placeholder: field.placeholder || '',
      group: field.group || UNGROUPED, required: field.required, order: field.order,
      is_sensitive: field.is_sensitive,
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
        placeholder: PLACEHOLDER_TYPES.has(formValues.field_type) ? formValues.placeholder : '',
        group: formValues.group === UNGROUPED ? null : formValues.group,
        required: !!formValues.required,
        order: Number(formValues.order) || 0,
        is_sensitive: !!formValues.is_sensitive,
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

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormValues({ ...emptyGroupForm, order: groups.length });
    setGroupFormErrors({});
    setGroupDrawerOpen(true);
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormValues({ name: group.name, order: group.order });
    setGroupFormErrors({});
    setGroupDrawerOpen(true);
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    setGroupSubmitting(true);
    setGroupFormErrors({});
    try {
      const payload = { entity, name: groupFormValues.name, order: Number(groupFormValues.order) || 0 };
      if (editingGroup) {
        await api.patch(`/custom-fields/groups/${editingGroup.id}`, payload);
      } else {
        await api.post('/custom-fields/groups', payload);
      }
      setGroupDrawerOpen(false);
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.errors && typeof err.errors === 'object') {
        setGroupFormErrors(err.errors);
      } else {
        setGroupFormErrors({ __all__: err.message || 'Something went wrong.' });
      }
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      await api.delete(`/custom-fields/groups/${deleteGroupTarget.id}`);
      setDeleteGroupTarget(null);
      reload();
    } catch (err) {
      setGroupFormErrors({ __all__: err.message || 'Could not delete this Data Title.' });
      setDeleteGroupTarget(null);
    } finally {
      setDeletingGroup(false);
    }
  };

  const drawerFields = [
    { key: 'label', label: 'Field Label', type: 'text', required: true },
    { key: 'key', label: 'Machine Key', type: 'text', required: true, placeholder: 'e.g. blood_group' },
    { key: 'group', label: 'Data Title', type: 'select', options: groupOptions },
    {
      key: 'field_type', label: 'Field Type', type: 'select', required: true,
      options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    ...(formValues.field_type === 'select'
      ? [{ key: 'options', label: 'Options (comma-separated)', type: 'text', placeholder: 'A+, O+, B+, AB+' }]
      : []),
    ...(PLACEHOLDER_TYPES.has(formValues.field_type)
      ? [{
          key: 'placeholder', label: 'Placeholder', type: 'text',
          placeholder: 'Guidance shown inside the input, e.g. "Enter your phone number"',
        }]
      : []),
    { key: 'required', label: 'Required', type: 'checkbox' },
    { key: 'order', label: 'Display Order', type: 'number' },
    {
      key: 'is_sensitive', label: 'Sensitive (e.g. NIN, bank account) — masked once saved, only the Super Admin sees it in full',
      type: 'checkbox',
    },
  ];

  const groupDrawerFields = [
    { key: 'name', label: 'Data Title', type: 'text', required: true, placeholder: 'e.g. Biodata' },
    { key: 'order', label: 'Display Order', type: 'number' },
  ];

  return (
    <SectionShell loading={loading} error={error} onReload={reload}>
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
            <div className="flex gap-sm">
              <Button variant="secondary" iconLeft="new_label" onClick={openCreateGroup}>
                New Data Title
              </Button>
              <Button variant="primary" iconLeft="add" onClick={openCreate}>
                New Field
              </Button>
            </div>
          </div>

          {formErrors.__all__ && <p className="font-label-md text-label-md text-error mb-md">{formErrors.__all__}</p>}

          {fields.length === 0 && groups.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="dynamic_form" text={`No custom fields defined for ${ENTITY_LABEL[entity]} yet`} />
            </Card>
          ) : (
            <div className="space-y-md">
              {sections.map((section) => (
                <Card key={section.key} padding="none" className="overflow-hidden">
                  <div className="flex items-center justify-between gap-sm px-lg py-3 border-b border-outline/10 bg-surface-container-low">
                    <h3 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wide">{section.label}</h3>
                    {section.group && (
                      <div className="flex gap-xs">
                        <button type="button" onClick={() => openEditGroup(section.group)} title="Edit Data Title" className="p-1.5 text-outline hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" onClick={() => setDeleteGroupTarget(section.group)} title="Delete Data Title" className="p-1.5 text-outline hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {section.fields.length === 0 ? (
                    <p className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">No fields under this Data Title yet.</p>
                  ) : (
                    <FieldsTable fields={section.fields} onEdit={openEdit} onDelete={setDeleteTarget} onToggleActive={toggleActive} />
                  )}
                </Card>
              ))}
            </div>
          )}

          <ProfileCompleteness entity={entity} />
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingField ? 'Edit Field' : `New ${ENTITY_LABEL[entity]} Field`}>
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

      <Drawer open={groupDrawerOpen} onClose={() => setGroupDrawerOpen(false)} title={editingGroup ? 'Edit Data Title' : 'New Data Title'}>
        <form onSubmit={handleGroupSubmit} className="space-y-lg">
          {groupFormErrors.__all__ && <p className="font-label-md text-label-md text-error">{groupFormErrors.__all__}</p>}
          {groupDrawerFields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={groupFormValues[field.key]}
              onChange={(v) => setGroupFormValues((prev) => ({ ...prev, [field.key]: v }))}
              error={groupFormErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setGroupDrawerOpen(false)} disabled={groupSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={groupSubmitting}>
              {groupSubmitting ? 'Saving…' : editingGroup ? 'Save Changes' : 'Add Data Title'}
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

      <ConfirmDialog
        open={!!deleteGroupTarget}
        title="Delete Data Title?"
        message={`This removes "${deleteGroupTarget?.name}". Fields under it are kept — they'll just move to Ungrouped.`}
        loading={deletingGroup}
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteGroupTarget(null)}
      />
    </SectionShell>
  );
}
