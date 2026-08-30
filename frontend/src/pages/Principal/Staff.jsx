import { useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

export default function PrincipalStaff() {
  const endpoints = useMemo(() => ({ staff: '/users/?user_type=staff' }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  // Principal oversight is teaching staff, not the whole back office —
  // accountants, HR, etc. stay out of this view. Teacher is a role assignment
  // (accounts.roles), not a separate user_type, so this filters client-side
  // rather than at the API layer.
  const staff = (data?.staff || []).filter((s) => s.roles.includes('teacher'));

  return (
    <DashboardPageShell
      portalId="principal"
      pageTitle="Staff"
      title="Staff"
      subtitle="Teaching staff and their assigned role — hiring and records stay with HR."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <Card padding={staff.length ? 'none' : 'lg'}>
          {staff.length === 0 ? (
            <EmptyState icon="badge" text="No data available yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Login</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Role(s)</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{s.full_name}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{s.email || s.phone || s.identifier}</td>
                      <td className="px-lg py-4">
                        <div className="flex flex-wrap gap-xs">
                          {s.roles.length === 0 ? (
                            <span className="font-label-sm text-label-sm text-outline">—</span>
                          ) : (
                            s.roles.map((slug) => (
                              <span key={slug} className="font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant capitalize">{slug}</span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-lg py-4"><Badge tone={s.is_active ? 'success' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </DashboardPageShell>
  );
}
