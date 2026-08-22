import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import { permissionRegistry, roles, superAdminNote } from './rolesPermissionsData.js';

function groupByModule(permissionCodes) {
  const set = new Set(permissionCodes);
  return Object.entries(permissionRegistry)
    .map(([module, actions]) => ({ module, actions: actions.filter((a) => set.has(`${module}.${a}`)) }))
    .filter((group) => group.actions.length > 0);
}

export default function SuperAdminRolesPermissions() {
  const [activeRole, setActiveRole] = useState(null);

  return (
    <AppShell portalId="superAdmin" pageTitle="Roles & Permissions" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Roles & Permissions"
          subtitle="Every role is a named bundle of permission strings — access is gated by permission, never by role name."
          actions={
            <Button variant="primary" iconLeft="add">
              Create Role
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {roles.map((role) => (
            <Card key={role.slug} padding="lg" className="flex flex-col gap-md">
              <div className="flex items-start justify-between gap-sm">
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">{role.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{role.description}</p>
                </div>
                {role.isSystem && (
                  <Badge tone="secondary" variant="ribbon" className="shrink-0">
                    System
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between pt-md border-t border-outline/10">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  View permissions
                </button>
              </div>
            </Card>
          ))}
        </div>

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
                {Object.entries(permissionRegistry).map(([module, actions]) => (
                  <tr key={module} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface capitalize">{module}</td>
                    <td className="px-lg py-4">
                      <div className="flex flex-wrap gap-xs">
                        {actions.map((action) => (
                          <span
                            key={action}
                            className="font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                          >
                            {module}.{action}
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

        <p className="font-label-sm text-label-sm text-on-surface-variant italic">{superAdminNote}</p>
      </div>

      <Drawer open={!!activeRole} onClose={() => setActiveRole(null)} title={activeRole?.name}>
        {activeRole && (
          <div className="space-y-lg">
            <p className="font-body-md text-body-md text-on-surface-variant">{activeRole.description}</p>
            {groupByModule(activeRole.permissions).map((group) => (
              <div key={group.module}>
                <h4 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wide mb-sm">{group.module}</h4>
                <div className="flex flex-wrap gap-xs">
                  {group.actions.map((action) => (
                    <span
                      key={action}
                      className="font-label-sm text-label-sm px-sm py-1 rounded-full bg-secondary-container text-on-secondary-container"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
