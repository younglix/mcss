import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/config/classes' };

const CLASS_FIELDS = [
  { key: 'name', id: 'class_name', label: 'Class Name', type: 'text', required: true, placeholder: 'e.g. JSS 1' },
  { key: 'level_order', id: 'class_level_order', label: 'Level Order', type: 'number', required: true, placeholder: 'e.g. 1 (drives promotion order)' },
];

const ARM_FIELDS = [{ key: 'name', id: 'arm_name', label: 'Arm Name', type: 'text', required: true, placeholder: 'e.g. A' }];

export default function SuperAdminClassesArms() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  const [classDrawer, setClassDrawer] = useState(false);
  const [classValues, setClassValues] = useState({ name: '', level_order: '' });
  const [armDrawer, setArmDrawer] = useState(null); // classId or null
  const [armValues, setArmValues] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'class'|'arm', id }
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  const classes = data?.classes || [];

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      await api.post('/config/classes', classValues);
      setClassDrawer(false);
      setClassValues({ name: '', level_order: '' });
      reload();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateArm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      await api.post(`/config/classes/${armDrawer}/arms`, armValues);
      setArmDrawer(null);
      setArmValues({ name: '' });
      reload();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const path = deleteTarget.type === 'class' ? `/config/classes/${deleteTarget.id}` : `/config/classes/arms/${deleteTarget.id}`;
      await api.delete(path);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not delete.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell
      pageTitle="Classes & Arms"
      title="Classes & Arms"
      subtitle="School classes and their arms/streams."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          {actionError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">
              {actionError}
            </p>
          )}
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={() => setClassDrawer(true)}>
              New Class
            </Button>
          </div>

          {classes.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="class" text="No data available yet" />
            </Card>
          ) : (
            <div className="space-y-sm">
              {classes.map((klass) => (
                <Card key={klass.id} padding="lg">
                  <div className="flex items-center justify-between gap-md flex-wrap">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{klass.name}</span>
                    <div className="flex flex-wrap items-center gap-xs">
                      {klass.arms.map((arm) => (
                        <span key={arm.id} className="inline-flex items-center gap-1 font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {arm.name}
                          <button type="button" onClick={() => setDeleteTarget({ type: 'arm', id: arm.id })} className="hover:text-error">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </span>
                      ))}
                      <button type="button" onClick={() => setArmDrawer(klass.id)} className="font-label-sm text-label-sm text-primary hover:underline">
                        + Add Arm
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ type: 'class', id: klass.id })} className="p-1 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={classDrawer} onClose={() => setClassDrawer(false)} title="New Class">
        <form onSubmit={handleCreateClass} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {CLASS_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={classValues[field.key]}
              onChange={(v) => setClassValues((prev) => ({ ...prev, [field.key]: v }))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setClassDrawer(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={!!armDrawer} onClose={() => setArmDrawer(null)} title="New Arm">
        <form onSubmit={handleCreateArm} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {ARM_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={armValues[field.key]}
              onChange={(v) => setArmValues((prev) => ({ ...prev, [field.key]: v }))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setArmDrawer(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Arm'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'class' ? 'Class' : 'Arm'}?`}
        message="This can't be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
