import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import FormField from '../../components/ui/FormField.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from './dashboard/DashboardPageShell.jsx';
import { useDashboardData } from './dashboard/useDashboardData.js';
import { EmptyState } from './dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { roles: '/rbac/roles', permissions: '/rbac/permissions' };

function groupByModule(permissionList, activeCodes) {
  const byModule = {};
  for (const perm of permissionList) {
    byModule[perm.module] ??= [];
    byModule[perm.module].push(perm);
  }
  return Object.entries(byModule).map(([module, perms]) => ({
    module,
    perms: perms.map((p) => ({ ...p, active: activeCodes.has(p.code) })),
  }));
}

export default function SuperAdminRolesPermissions() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  const [activeRole, setActiveRole] = useState(null);
  const [editableCodes, setEditableCodes] = useState(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createValues, setCreateValues] = useState({ name: '', slug: '', description: '' });
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openRole = (role) => {
    setActiveRole(role);
    setEditableCodes(new Set(role.permissions));
    setPermissionsError('');
  };

  const togglePermission = (code) => {
    setEditableCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const savePermissions = async () => {
    setSavingPermissions(true);
    setPermissionsError('');
    try {
      await api.put(`/rbac/roles/${activeRole.id}/permissions`, { permission_codes: [...editableCodes] });
      setActiveRole(null);
      reload();
    } catch (err) {
      setPermissionsError(err.message || 'Could not save permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});
    try {
      const slug = createValues.slug || createValues.name.toLowerCase().trim().replace(/\s+/g, '-');
      await api.post('/rbac/roles', { ...createValues, slug });
      setCreateDrawerOpen(false);
      setCreateValues({ name: '', slug: '', description: '' });
      reload();
    } catch (err) {
      setCreateErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async () => {
    setDeleting(true);
    try {
      await api.delete(`/rbac/roles/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setPermissionsError(err.message || 'Could not delete role.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const roles = data?.roles || [];
  const permissions = data?.permissions || [];

  return (
    <DashboardPageShell
      pageTitle="Roles & Permissions"
      title="Roles & Permissions"
      subtitle="Every role is a named bundle of permission strings — access is gated by permission, never by role name."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={3}
    >
      {data && (
        <div className="space-y-lg sm:space-y-xl">
          <div className="flex justify-end -mt-lg sm:-mt-xl mb-0">
            <Button variant="primary" iconLeft="add" onClick={() => setCreateDrawerOpen(true)}>
              Create Role
            </Button>
          </div>

          {roles.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="admin_panel_settings" text="No data available yet" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
              {roles.map((role) => (
                <Card key={role.id} padding="lg" className="flex flex-col gap-md">
                  <div className="flex items-start justify-between gap-sm">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-primary">{role.name}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{role.description}</p>
                    </div>
                    {role.is_system && (
                      <Badge tone="secondary" variant="ribbon" className="shrink-0">
                        System
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-md border-t border-outline/10">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
                    </span>
                    <div className="flex items-center gap-md">
                      <button type="button" onClick={() => openRole(role)} className="font-label-md text-label-md text-primary hover:underline">
                        Edit permissions
                      </button>
                      {!role.is_system && (
                        <button type="button" onClick={() => setDeleteTarget(role)} className="text-outline hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card padding="none" className="overflow-hidden">
            <div className="px-lg py-md border-b border-outline/10 bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-primary">Permission Registry</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                The full set of permission strings the backend enforces, grouped by module.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Module</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {groupByModule(permissions, new Set()).map(({ module, perms }) => (
                    <tr key={module} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface capitalize">{module}</td>
                      <td className="px-lg py-4">
                        <div className="flex flex-wrap gap-xs">
                          {perms.map((p) => (
                            <span key={p.code} className="font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                              {p.code}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="font-label-sm text-label-sm text-on-surface-variant italic">
            Super Admin bypasses this registry entirely — every permission check returns true for that one account, by design.
          </p>
        </div>
      )}

      <Drawer open={!!activeRole} onClose={() => setActiveRole(null)} title={activeRole ? `Edit ${activeRole.name}` : ''}>
        {activeRole && (
          <div className="space-y-lg">
            <p className="font-body-md text-body-md text-on-surface-variant">{activeRole.description}</p>
            {permissionsError && <p className="font-label-md text-label-md text-error">{permissionsError}</p>}
            {groupByModule(permissions, editableCodes).map((group) => (
              <div key={group.module}>
                <h4 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wide mb-sm">{group.module}</h4>
                <div className="flex flex-wrap gap-xs">
                  {group.perms.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => togglePermission(p.code)}
                      className={`font-label-sm text-label-sm px-sm py-1 rounded-full border transition-colors ${
                        p.active ? 'bg-secondary-container text-on-secondary-container border-secondary-container' : 'border-outline/20 text-on-surface-variant'
                      }`}
                    >
                      {p.action}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
              <Button variant="ghost" onClick={() => setActiveRole(null)} disabled={savingPermissions}>
                Cancel
              </Button>
              <Button variant="primary" onClick={savePermissions} disabled={savingPermissions}>
                {savingPermissions ? 'Saving…' : 'Save Permissions'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} title="Create Role">
        <form onSubmit={handleCreateRole} className="space-y-lg">
          {createErrors.__all__ && <p className="font-label-md text-label-md text-error">{createErrors.__all__}</p>}
          <FormField
            field={{ key: 'name', label: 'Role Name', type: 'text', required: true }}
            value={createValues.name}
            onChange={(v) => setCreateValues((prev) => ({ ...prev, name: v }))}
            error={createErrors.name?.[0]}
          />
          <FormField
            field={{ key: 'description', label: 'Description', type: 'textarea' }}
            value={createValues.description}
            onChange={(v) => setCreateValues((prev) => ({ ...prev, description: v }))}
            error={createErrors.description?.[0]}
          />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setCreateDrawerOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Role?"
        message={`This can't be undone. Delete "${deleteTarget?.name}"?`}
        loading={deleting}
        onConfirm={handleDeleteRole}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
