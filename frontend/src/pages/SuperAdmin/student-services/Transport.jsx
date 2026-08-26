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

const ENDPOINTS = {
  routes: '/student-services/transport/routes',
  vehicles: '/student-services/transport/vehicles',
  assignments: '/student-services/transport/assignments',
  students: '/academics/students',
};

const ROUTE_FIELDS = [
  { key: 'name', id: 'route_name', label: 'Route Name', type: 'text', required: true },
  { key: 'description', id: 'route_description', label: 'Description', type: 'textarea' },
  { key: 'fee_amount', id: 'route_fee', label: 'Fee Amount', type: 'number' },
];

export default function SuperAdminTransport() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const routes = data?.routes || [];
  const vehicles = data?.vehicles || [];
  const assignments = data?.assignments || [];
  const students = data?.students || [];

  const [routeDrawer, setRouteDrawer] = useState(false);
  const [routeValues, setRouteValues] = useState({ name: '', description: '', fee_amount: '' });
  const [routeErrors, setRouteErrors] = useState({});
  const [savingRoute, setSavingRoute] = useState(false);

  const [vehicleDrawer, setVehicleDrawer] = useState(false);
  const [vehicleValues, setVehicleValues] = useState({ plate_number: '', capacity: 20, driver_name: '', driver_phone: '', route: '' });
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [savingVehicle, setSavingVehicle] = useState(false);

  const [assignDrawer, setAssignDrawer] = useState(false);
  const [assignValues, setAssignValues] = useState({ student: '', route: '', pickup_point: '' });
  const [assignErrors, setAssignErrors] = useState({});
  const [savingAssign, setSavingAssign] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }
  const [deleting, setDeleting] = useState(false);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    setSavingRoute(true);
    setRouteErrors({});
    try {
      const payload = Object.fromEntries(Object.entries(routeValues).filter(([, v]) => v !== ''));
      await api.post('/student-services/transport/routes', payload);
      setRouteDrawer(false);
      setRouteValues({ name: '', description: '', fee_amount: '' });
      reload();
    } catch (err) {
      setRouteErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingRoute(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setSavingVehicle(true);
    setVehicleErrors({});
    try {
      const payload = Object.fromEntries(Object.entries(vehicleValues).filter(([, v]) => v !== ''));
      await api.post('/student-services/transport/vehicles', payload);
      setVehicleDrawer(false);
      setVehicleValues({ plate_number: '', capacity: 20, driver_name: '', driver_phone: '', route: '' });
      reload();
    } catch (err) {
      setVehicleErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSavingAssign(true);
    setAssignErrors({});
    try {
      await api.post('/student-services/transport/assignments', assignValues);
      setAssignDrawer(false);
      setAssignValues({ student: '', route: '', pickup_point: '' });
      reload();
    } catch (err) {
      setAssignErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingAssign(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const path =
        deleteTarget.type === 'route' ? `/student-services/transport/routes/${deleteTarget.id}`
        : deleteTarget.type === 'vehicle' ? `/student-services/transport/vehicles/${deleteTarget.id}`
        : `/student-services/transport/assignments/${deleteTarget.id}`;
      await api.delete(path);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  const routeOptions = routes.map((r) => ({ value: r.id, label: r.name }));

  return (
    <DashboardPageShell pageTitle="Transport" title="Transport" subtitle="Routes, vehicles, and student assignments." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div className="space-y-lg">
          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Routes</h2>
            <Button variant="primary" iconLeft="add" onClick={() => setRouteDrawer(true)}>New Route</Button>
          </div>
          <Card padding={routes.length ? 'none' : 'lg'}>
            {routes.length === 0 ? <EmptyState icon="alt_route" text="No data available yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Fee</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {routes.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{r.name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{r.fee_amount ?? '—'}</td>
                        <td className="px-lg py-4 text-right">
                          <button type="button" onClick={() => setDeleteTarget({ type: 'route', id: r.id })} className="p-2 text-outline hover:text-error transition-colors">
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

          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Vehicles</h2>
            <Button variant="primary" iconLeft="add" onClick={() => setVehicleDrawer(true)}>New Vehicle</Button>
          </div>
          <Card padding={vehicles.length ? 'none' : 'lg'}>
            {vehicles.length === 0 ? <EmptyState icon="directions_bus" text="No data available yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Plate</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Driver</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Route</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{v.plate_number}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{v.driver_name || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{v.route_name || '—'}</td>
                        <td className="px-lg py-4 text-right">
                          <button type="button" onClick={() => setDeleteTarget({ type: 'vehicle', id: v.id })} className="p-2 text-outline hover:text-error transition-colors">
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

          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Student Assignments</h2>
            <Button variant="primary" iconLeft="add" onClick={() => setAssignDrawer(true)}>Assign Student</Button>
          </div>
          <Card padding={assignments.length ? 'none' : 'lg'}>
            {assignments.length === 0 ? <EmptyState icon="person_pin_circle" text="No data available yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Route</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Pickup Point</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{a.student_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.route_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{a.pickup_point || '—'}</td>
                        <td className="px-lg py-4 text-right">
                          <button type="button" onClick={() => setDeleteTarget({ type: 'assignment', id: a.id })} className="p-2 text-outline hover:text-error transition-colors">
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

      <Drawer open={routeDrawer} onClose={() => setRouteDrawer(false)} title="New Route">
        <form onSubmit={handleCreateRoute} className="space-y-lg">
          {routeErrors.__all__ && <p className="font-label-md text-label-md text-error">{routeErrors.__all__}</p>}
          {ROUTE_FIELDS.map((field) => (
            <FormField key={field.key} field={field} value={routeValues[field.key]} onChange={(v) => setRouteValues((p) => ({ ...p, [field.key]: v }))} error={routeErrors[field.key]?.[0]} />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setRouteDrawer(false)} disabled={savingRoute}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingRoute}>{savingRoute ? 'Saving…' : 'Create Route'}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={vehicleDrawer} onClose={() => setVehicleDrawer(false)} title="New Vehicle">
        <form onSubmit={handleCreateVehicle} className="space-y-lg">
          {vehicleErrors.__all__ && <p className="font-label-md text-label-md text-error">{vehicleErrors.__all__}</p>}
          <FormField field={{ key: 'plate_number', id: 'vehicle_plate', label: 'Plate Number', type: 'text', required: true }} value={vehicleValues.plate_number} onChange={(v) => setVehicleValues((p) => ({ ...p, plate_number: v }))} error={vehicleErrors.plate_number?.[0]} />
          <FormField field={{ key: 'capacity', id: 'vehicle_capacity', label: 'Capacity', type: 'number', required: true }} value={vehicleValues.capacity} onChange={(v) => setVehicleValues((p) => ({ ...p, capacity: v }))} error={vehicleErrors.capacity?.[0]} />
          <FormField field={{ key: 'driver_name', id: 'vehicle_driver_name', label: 'Driver Name', type: 'text' }} value={vehicleValues.driver_name} onChange={(v) => setVehicleValues((p) => ({ ...p, driver_name: v }))} />
          <FormField field={{ key: 'driver_phone', id: 'vehicle_driver_phone', label: 'Driver Phone', type: 'text' }} value={vehicleValues.driver_phone} onChange={(v) => setVehicleValues((p) => ({ ...p, driver_phone: v }))} />
          <FormField field={{ key: 'route', id: 'vehicle_route', label: 'Route', type: 'select', options: routeOptions }} value={vehicleValues.route} onChange={(v) => setVehicleValues((p) => ({ ...p, route: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setVehicleDrawer(false)} disabled={savingVehicle}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingVehicle}>{savingVehicle ? 'Saving…' : 'Create Vehicle'}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={assignDrawer} onClose={() => setAssignDrawer(false)} title="Assign Student to Route">
        <form onSubmit={handleAssign} className="space-y-lg">
          {assignErrors.__all__ && <p className="font-label-md text-label-md text-error">{assignErrors.__all__}</p>}
          <FormField field={{ key: 'student', id: 'assign_student', label: 'Student', type: 'select', required: true, options: students.map((s) => ({ value: s.id, label: s.full_name })) }} value={assignValues.student} onChange={(v) => setAssignValues((p) => ({ ...p, student: v }))} error={assignErrors.student?.[0]} />
          <FormField field={{ key: 'route', id: 'assign_route', label: 'Route', type: 'select', required: true, options: routeOptions }} value={assignValues.route} onChange={(v) => setAssignValues((p) => ({ ...p, route: v }))} error={assignErrors.route?.[0]} />
          <FormField field={{ key: 'pickup_point', id: 'assign_pickup', label: 'Pickup Point', type: 'text' }} value={assignValues.pickup_point} onChange={(v) => setAssignValues((p) => ({ ...p, pickup_point: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setAssignDrawer(false)} disabled={savingAssign}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingAssign}>{savingAssign ? 'Saving…' : 'Assign'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete?"
        message="This can't be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
