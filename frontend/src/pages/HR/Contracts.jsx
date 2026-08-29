import { useMemo, useRef, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import FormField from '../../components/ui/FormField.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { contracts: '/operations/hr/contracts', staff: '/users/?user_type=staff' };

const TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'fixed_term', label: 'Fixed Term' },
  { value: 'probation', label: 'Probation' },
  { value: 'consultant', label: 'Consultant' },
];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
];
const STATUS_TONE = { active: 'success', expired: 'secondary', terminated: 'error' };

const EMPTY_FORM = { staff: '', contract_type: 'permanent', start_date: '', end_date: '', terms: '', status: 'active' };

export default function HRContracts() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const contracts = data?.contracts || [];
  const staff = data?.staff || [];
  const staffOptions = staff.map((s) => ({ value: s.id, label: s.full_name }));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const openNew = () => {
    setEditing(null);
    setValues(EMPTY_FORM);
    setFile(null);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (contract) => {
    setEditing(contract);
    setValues({
      staff: contract.staff, contract_type: contract.contract_type, start_date: contract.start_date,
      end_date: contract.end_date || '', terms: contract.terms || '', status: contract.status,
    });
    setFile(null);
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      let fileUrl;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploaded = await api.post('/operations/hr/upload', formData);
        fileUrl = uploaded.url;
      }
      const payload = fileUrl !== undefined ? { ...values, file_url: fileUrl } : values;
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== ''));
      if (editing) {
        await api.patch(`/operations/hr/contracts/${editing.id}`, cleaned);
      } else {
        await api.post('/operations/hr/contracts', cleaned);
      }
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/operations/hr/contracts/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell portalId="hr" pageTitle="Contracts" title="Contracts" subtitle="Employment contracts, terms, and expiry." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openNew}>New Contract</Button>
          </div>
          <Card padding={contracts.length ? 'none' : 'lg'}>
            {contracts.length === 0 ? <EmptyState icon="description" text="No contracts recorded yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Start</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">End</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{c.staff_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{c.contract_type.replace('_', ' ')}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{c.start_date}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{c.end_date || 'Open-ended'}</td>
                        <td className="px-lg py-4"><Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge></td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          {c.file_url && (
                            <a href={c.file_url} target="_blank" rel="noreferrer" title="Open" className="p-2 text-outline hover:text-primary transition-colors inline-block">
                              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                            </a>
                          )}
                          <button type="button" onClick={() => openEdit(c)} title="Edit" className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(c)} title="Delete" className="p-2 text-outline hover:text-error transition-colors">
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Contract' : 'New Contract'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField field={{ key: 'staff', id: 'contract_staff', label: 'Staff', type: 'select', required: true, options: staffOptions }} value={values.staff} onChange={(v) => setValues((p) => ({ ...p, staff: v }))} error={errors.staff?.[0]} />
          <FormField field={{ key: 'contract_type', id: 'contract_type', label: 'Contract Type', type: 'select', options: TYPE_OPTIONS }} value={values.contract_type} onChange={(v) => setValues((p) => ({ ...p, contract_type: v }))} />
          <FormField field={{ key: 'start_date', id: 'contract_start', label: 'Start Date', type: 'date', required: true }} value={values.start_date} onChange={(v) => setValues((p) => ({ ...p, start_date: v }))} error={errors.start_date?.[0]} />
          <FormField field={{ key: 'end_date', id: 'contract_end', label: 'End Date (leave blank for open-ended)', type: 'date' }} value={values.end_date} onChange={(v) => setValues((p) => ({ ...p, end_date: v }))} error={errors.end_date?.[0]} />
          <FormField field={{ key: 'status', id: 'contract_status', label: 'Status', type: 'select', options: STATUS_OPTIONS }} value={values.status} onChange={(v) => setValues((p) => ({ ...p, status: v }))} />
          <FormField field={{ key: 'terms', id: 'contract_terms', label: 'Terms', type: 'textarea' }} value={values.terms} onChange={(v) => setValues((p) => ({ ...p, terms: v }))} />
          <div>
            <label className="font-label-md text-label-md text-on-surface mb-xs block">Contract File (optional)</label>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mcss-field w-full px-md py-sm text-left font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors">
              {file ? file.name : 'Choose a file…'}
            </button>
            <input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          </div>
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Contract'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contract?"
        message={`This can't be undone. Delete this contract for ${deleteTarget?.staff_name}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
