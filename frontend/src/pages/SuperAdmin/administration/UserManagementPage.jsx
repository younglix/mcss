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

const USER_TYPE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
  { value: 'applicant', label: 'Applicant' },
];

const emptyForm = { full_name: '', email: '', phone: '', identifier: '', user_type: 'staff', password: '' };

export default function UserManagementPage({ portalId = 'superAdmin', pageTitle, title, subtitle, userTypeFilter, emptyIcon = 'group' }) {
  const usersEndpoint = userTypeFilter ? `/users/?user_type=${userTypeFilter}` : '/users/';
  const endpoints = useMemo(() => ({ users: usersEndpoint, roles: '/rbac/roles' }), [usersEndpoint]);
  const { data, loading, error, reload } = useDashboardData(endpoints);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resetResult, setResetResult] = useState(null); // { user, tempPassword }
  const [actionError, setActionError] = useState('');
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});

  const users = data?.users || [];
  const roles = data?.roles || [];

  const loadCustomFields = async (userId) => {
    try {
      const query = userId ? `&entity_id=${userId}` : '';
      const result = await api.get(`/custom-fields/values?entity=staff${query}`);
      setCustomFields(result || []);
      setCustomFieldValues(Object.fromEntries((result || []).map((f) => [f.field_id, f.value ?? ''])));
    } catch {
      setCustomFields([]);
      setCustomFieldValues({});
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    const userType = userTypeFilter || 'staff';
    setFormValues({ ...emptyForm, user_type: userType });
    setSelectedRoleIds([]);
    setFormErrors({});
    setDrawerOpen(true);
    if (userType === 'staff') loadCustomFields(null);
    else { setCustomFields([]); setCustomFieldValues({}); }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormValues({
      full_name: user.full_name,
      email: user.email || '',
      phone: user.phone || '',
      identifier: user.identifier || '',
      user_type: user.user_type,
      password: '',
    });
    const roleIdsForUser = roles.filter((r) => user.roles.includes(r.slug)).map((r) => r.id);
    setSelectedRoleIds(roleIdsForUser);
    setFormErrors({});
    setDrawerOpen(true);
    if (user.user_type === 'staff') loadCustomFields(user.id);
    else { setCustomFields([]); setCustomFieldValues({}); }
  };

  const handleUserTypeChange = (v) => {
    setFormValues((prev) => ({ ...prev, user_type: v }));
    if (v === 'staff') loadCustomFields(editingUser ? editingUser.id : null);
    else { setCustomFields([]); setCustomFieldValues({}); }
  };

  const toggleRole = (roleId) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      let userId = editingUser?.id;
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, {
          full_name: formValues.full_name,
          user_type: formValues.user_type,
        });
        await api.post(`/rbac/users/${editingUser.id}/roles`, { role_ids: selectedRoleIds });
      } else {
        const payload = { ...formValues, role_ids: selectedRoleIds };
        if (!payload.email) delete payload.email;
        if (!payload.phone) delete payload.phone;
        if (!payload.identifier) delete payload.identifier;
        const result = await api.post('/users/', payload);
        userId = result.id;
      }
      if (formValues.user_type === 'staff' && customFields.length > 0) {
        await api.put('/custom-fields/values/bulk', {
          entity: 'staff',
          entity_id: userId,
          values: customFields.map((f) => ({ field_id: f.field_id, value: customFieldValues[f.field_id] ?? null })),
        });
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

  const handleToggleActive = async (user) => {
    setActionError('');
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not update the user.');
    }
  };

  const handleResetPassword = async (user) => {
    setActionError('');
    try {
      const result = await api.post(`/users/${user.id}/reset-password`, {});
      setResetResult({ user, tempPassword: result.temporary_password });
    } catch (err) {
      setActionError(err.message || 'Could not reset password.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not delete this user.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell portalId={portalId} pageTitle={pageTitle} title={title} subtitle={subtitle} loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          {actionError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">
              {actionError}
            </p>
          )}
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={openCreate}>
              New User
            </Button>
          </div>

          <Card padding={users.length ? 'none' : 'lg'}>
            {users.length === 0 ? (
              <EmptyState icon={emptyIcon} text="No data available yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-200 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Login</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Roles</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{user.full_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{user.email || user.phone || user.identifier}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{user.user_type}</td>
                        <td className="px-lg py-4">
                          <div className="flex flex-wrap gap-xs">
                            {user.roles.length === 0 ? (
                              <span className="font-label-sm text-label-sm text-outline">—</span>
                            ) : (
                              user.roles.map((slug) => (
                                <span key={slug} className="font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant capitalize">
                                  {slug}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-lg py-4">
                          <button type="button" onClick={() => handleToggleActive(user)}>
                            <Badge tone={user.is_active ? 'success' : 'secondary'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
                          </button>
                        </td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => handleResetPassword(user)} title="Reset password" className="p-2 text-outline hover:text-secondary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">key</span>
                          </button>
                          <button type="button" onClick={() => openEdit(user)} title="Edit" className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(user)} title="Delete" className="p-2 text-outline hover:text-error transition-colors">
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingUser ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          <FormField
            field={{ key: 'full_name', label: 'Full Name', type: 'text', required: true }}
            value={formValues.full_name}
            onChange={(v) => setFormValues((prev) => ({ ...prev, full_name: v }))}
            error={formErrors.full_name?.[0]}
          />
          <FormField
            field={{ key: 'user_type', label: 'User Type', type: 'select', required: true, options: USER_TYPE_OPTIONS }}
            value={formValues.user_type}
            onChange={handleUserTypeChange}
            error={formErrors.user_type?.[0]}
          />
          {!editingUser && (
            <>
              <FormField
                field={{ key: 'email', label: 'Email', type: 'text', placeholder: 'Optional if phone/identifier is set' }}
                value={formValues.email}
                onChange={(v) => setFormValues((prev) => ({ ...prev, email: v }))}
                error={formErrors.email?.[0]}
              />
              <FormField
                field={{ key: 'phone', label: 'Phone', type: 'text' }}
                value={formValues.phone}
                onChange={(v) => setFormValues((prev) => ({ ...prev, phone: v }))}
                error={formErrors.phone?.[0]}
              />
              <FormField
                field={{ key: 'identifier', label: 'Identifier (e.g. admission/staff number)', type: 'text' }}
                value={formValues.identifier}
                onChange={(v) => setFormValues((prev) => ({ ...prev, identifier: v }))}
                error={formErrors.identifier?.[0]}
              />
              <FormField
                field={{ key: 'password', label: 'Initial Password', type: 'password', required: true }}
                value={formValues.password}
                onChange={(v) => setFormValues((prev) => ({ ...prev, password: v }))}
                error={formErrors.password?.[0]}
              />
            </>
          )}
          {customFields.length > 0 && (
            <div className="space-y-lg pt-md border-t border-outline/10">
              {customFields.map((f) => (
                <FormField
                  key={f.field_id}
                  field={{
                    key: f.field_id, label: f.label, type: f.field_type, required: f.required,
                    options: (f.options || []).map((o) => ({ value: o, label: o })),
                  }}
                  value={customFieldValues[f.field_id] ?? ''}
                  onChange={(v) => setCustomFieldValues((prev) => ({ ...prev, [f.field_id]: v }))}
                />
              ))}
            </div>
          )}
          <div>
            <p className="font-label-md text-label-md text-on-surface mb-xs">Roles</p>
            <div className="flex flex-wrap gap-xs">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`font-label-sm text-label-sm px-sm py-1 rounded-full border transition-colors ${
                    selectedRoleIds.includes(role.id) ? 'bg-primary text-on-primary border-primary' : 'border-outline/20 text-on-surface-variant'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User?"
        message={`This can't be undone. Delete ${deleteTarget?.full_name}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {resetResult && (
        <ConfirmDialog
          open
          title="Password Reset"
          message={`Temporary password for ${resetResult.user.full_name}: ${resetResult.tempPassword} — share this with them securely; it won't be shown again.`}
          confirmLabel="Done"
          danger={false}
          onConfirm={() => setResetResult(null)}
          onCancel={() => setResetResult(null)}
        />
      )}
    </DashboardPageShell>
  );
}
