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

const ENDPOINTS = { items: '/operations/inventory/items' };

function TransactionAction({ item, reload }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ transaction_type: 'in', quantity: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/operations/inventory/items/${item.id}/transactions`, values);
      setOpen(false);
      setValues({ transaction_type: 'in', quantity: '', notes: '' });
      reload();
    } catch (err) {
      setError(err.message || 'Could not record transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="font-label-sm text-label-sm text-primary hover:underline">
        Record Transaction
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Stock Transaction — ${item.name}`}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {error && <p className="font-label-md text-label-md text-error">{error}</p>}
          <FormField
            field={{ key: 'transaction_type', id: `txn_type_${item.id}`, label: 'Type', type: 'select', options: [{ value: 'in', label: 'Stock In' }, { value: 'out', label: 'Stock Out' }] }}
            value={values.transaction_type}
            onChange={(v) => setValues((p) => ({ ...p, transaction_type: v }))}
          />
          <FormField
            field={{ key: 'quantity', id: `txn_qty_${item.id}`, label: 'Quantity', type: 'number', required: true }}
            value={values.quantity}
            onChange={(v) => setValues((p) => ({ ...p, quantity: v }))}
          />
          <FormField
            field={{ key: 'notes', id: `txn_notes_${item.id}`, label: 'Notes', type: 'text' }}
            value={values.notes}
            onChange={(v) => setValues((p) => ({ ...p, notes: v }))}
          />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving || !values.quantity}>{saving ? 'Saving…' : 'Record'}</Button>
          </div>
        </form>
      </Drawer>
    </>
  );
}

const ITEM_FIELDS = [
  { key: 'name', id: 'item_name', label: 'Item Name', type: 'text', required: true },
  { key: 'category', id: 'item_category', label: 'Category', type: 'text' },
  { key: 'quantity', id: 'item_quantity', label: 'Starting Quantity', type: 'number', required: true },
  { key: 'unit', id: 'item_unit', label: 'Unit', type: 'text', placeholder: 'e.g. pcs, boxes' },
  { key: 'reorder_level', id: 'item_reorder', label: 'Reorder Level', type: 'number' },
  { key: 'location', id: 'item_location', label: 'Location', type: 'text' },
];

export default function SuperAdminInventory() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const items = data?.items || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ name: '', category: '', quantity: 0, unit: '', reorder_level: 0, location: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setValues({ name: '', category: '', quantity: 0, unit: '', reorder_level: 0, location: '' });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setValues({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, reorder_level: item.reorder_level, location: item.location });
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (editing) {
        await api.patch(`/operations/inventory/items/${editing.id}`, values);
      } else {
        await api.post('/operations/inventory/items', values);
      }
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/operations/inventory/items/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Inventory" title="Inventory" subtitle="Stock items and transactions." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openCreate}>New Item</Button>
          </div>
          <Card padding={items.length ? 'none' : 'lg'}>
            {items.length === 0 ? <EmptyState icon="inventory_2" text="No data available yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Category</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Quantity</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Location</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{item.name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{item.category || '—'}</td>
                        <td className="px-lg py-4">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{item.quantity} {item.unit}</span>
                          {item.low_stock && <Badge tone="error" className="ml-xs">Low</Badge>}
                        </td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{item.location || '—'}</td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          <TransactionAction item={item} reload={reload} />
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Item' : 'New Item'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          {ITEM_FIELDS.map((field) => (
            <FormField key={field.key} field={field} value={values[field.key]} onChange={(v) => setValues((p) => ({ ...p, [field.key]: v }))} error={errors[field.key]?.[0]} />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Item'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item?"
        message={`This can't be undone. Delete "${deleteTarget?.name}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
