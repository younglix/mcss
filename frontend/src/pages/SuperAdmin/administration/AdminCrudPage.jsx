import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

/**
 * Generic list + create/edit-drawer + delete-confirm scaffold for the
 * Administration CRUD pages that are a flat list of records (Departments,
 * Reception visitors, Calendar events, Site Announcements). Pages whose UX
 * doesn't fit a flat table (nested Sessions/Terms, Classes/Arms, Roles,
 * Staff/User management) are hand-built but still reuse DashboardPageShell,
 * Drawer, ConfirmDialog, and FormField from here.
 */
export default function AdminCrudPage({
  pageTitle,
  title,
  subtitle,
  endpoint,
  itemLabel,
  columns,
  formFields,
  initialFormValues = {},
  emptyIcon = 'inbox',
  renderExtraActions,
  // Optional {key: url} of reference data (e.g. class arms, subjects) a page
  // needs to build dynamic select options. Must be a stable (memoized)
  // object — it's a useDashboardData dependency. When present, `formFields`
  // and `columns` may be functions of that extra data instead of plain
  // arrays: (extra) => [...].
  extraEndpoints,
  // Optional (key, value, formValues, setFormValues, extra) hook fired
  // after a field's own value is set — lets a page side-effect other fields
  // (e.g. picking a catalog item auto-fills description/amount). The
  // changed field's own key/value is unaffected by this; it's purely for
  // extra derived updates.
  onFieldChange,
}) {
  const endpoints = useMemo(() => ({ items: endpoint, ...extraEndpoints }), [endpoint, extraEndpoints]);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const extra = useMemo(() => {
    if (!data) return {};
    const { items: _items, ...rest } = data;
    return rest;
  }, [data]);
  const fields = typeof formFields === 'function' ? formFields(extra) : formFields;
  const resolvedColumns = typeof columns === 'function' ? columns(extra) : columns;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditingItem(null);
    setFormValues(initialFormValues);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormValues(
      Object.fromEntries(
        fields.map((f) => {
          let value = item[f.key];
          // API returns full ISO timestamps; datetime-local inputs need
          // "YYYY-MM-DDTHH:mm" with no seconds/timezone suffix.
          if (f.type === 'datetime-local' && value) value = value.slice(0, 16);
          return [f.key, value];
        }),
      ),
    );
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      // Optional fields left blank (e.g. datetime-local) submit as "" — DRF
      // rejects "" for DateTimeField (only null or a real timestamp), so omit
      // untouched-blank keys rather than sending an empty string.
      const payload = Object.fromEntries(Object.entries(formValues).filter(([, v]) => v !== ''));
      if (editingItem) {
        await api.patch(`${endpoint}/${editingItem.id}`, payload);
      } else {
        await api.post(endpoint, payload);
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`${endpoint}/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setFormErrors({ __all__: err.message || 'Could not delete.' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.items || [];

  return (
    <DashboardPageShell
      pageTitle={pageTitle}
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openCreate}>
              New {itemLabel}
            </Button>
          </div>

          <Card padding={items.length ? 'none' : 'lg'}>
            {items.length === 0 ? (
              <EmptyState icon={emptyIcon} text="No data available yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      {resolvedColumns.map((col) => (
                        <th key={col.key} className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                        {resolvedColumns.map((col) => (
                          <td key={col.key} className="px-lg py-4 font-body-md text-body-md text-on-surface">
                            {col.render ? col.render(item) : String(item[col.key] ?? '—')}
                          </td>
                        ))}
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          {renderExtraActions?.(item, reload)}
                          <button type="button" onClick={() => openEdit(item)} className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(item)} className="p-2 text-outline hover:text-error transition-colors">
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingItem ? `Edit ${itemLabel}` : `New ${itemLabel}`}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {formErrors.__all__ && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">
              {formErrors.__all__}
            </p>
          )}
          {fields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={(v) => {
                setFormValues((prev) => ({ ...prev, [field.key]: v }));
                onFieldChange?.(field.key, v, formValues, setFormValues, extra);
              }}
              error={formErrors[field.key]?.[0] || formErrors[field.key]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingItem ? 'Save Changes' : `Create ${itemLabel}`}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${itemLabel}?`}
        message={`This can't be undone. Are you sure you want to delete this ${itemLabel.toLowerCase()}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
