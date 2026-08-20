import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { stats, routes, routeStatusTone, selectedFleet, studentMapping } from './transportData.js';

export default function AdminTransportDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Transport Admin" user={{ name: 'Admin User' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Transport Logistics" subtitle="Routes, fleet status, and student-to-bus mapping." />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <Card padding="lg" className="flex flex-col justify-between hover:border-primary transition-all">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{stats[0].label}</p>
              <h3 className="font-headline-lg text-headline-lg text-primary mt-xs">{stats[0].value}</h3>
            </div>
            <div className="flex items-center justify-between mt-md">
              <span className="text-secondary font-label-md">{stats[0].note}</span>
              <span className="material-symbols-outlined text-primary">{stats[0].icon}</span>
            </div>
          </Card>
          <Card padding="lg" className="flex flex-col justify-between">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{stats[1].label}</p>
              <h3 className="font-headline-lg text-headline-lg text-primary mt-xs">{stats[1].value}</h3>
            </div>
            <div className="mt-md h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="bg-secondary-container h-full" style={{ width: `${stats[1].progress}%` }} />
            </div>
          </Card>
          <Card padding="lg" className="flex flex-col justify-between">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{stats[2].label}</p>
              <h3 className="font-headline-lg text-headline-lg text-primary mt-xs">{stats[2].value}</h3>
            </div>
            <div className="mt-md">
              <Badge tone="warning">{stats[2].badge}</Badge>
            </div>
          </Card>
          <button className="bg-primary flex flex-col items-center justify-center gap-sm p-lg rounded-lg shadow-lg hover:bg-primary-container transition-all text-on-primary">
            <span className="material-symbols-outlined text-[32px]">add_road</span>
            <span className="font-headline-md text-headline-md">Add New Route</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <Card padding="none" className="lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline/10 flex items-center justify-between bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-primary">Active Bus Routes</h2>
              <button className="p-1 rounded-md border border-outline/20 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead className="bg-secondary text-on-secondary">
                  <tr>
                    <th className="px-lg py-md font-label-md uppercase tracking-wider">Route ID</th>
                    <th className="px-lg py-md font-label-md uppercase tracking-wider">Primary Destination</th>
                    <th className="px-lg py-md font-label-md uppercase tracking-wider">Stops</th>
                    <th className="px-lg py-md font-label-md uppercase tracking-wider">Capacity</th>
                    <th className="px-lg py-md font-label-md uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                      <td className="px-lg py-lg font-headline-md text-body-md text-primary">{route.id}</td>
                      <td className="px-lg py-lg font-body-md">{route.destination}</td>
                      <td className="px-lg py-lg font-body-md">{route.stops}</td>
                      <td className="px-lg py-lg">
                        <div className="flex items-center gap-sm">
                          <span className="font-label-md">
                            {route.filled}/{route.capacity}
                          </span>
                          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className={`h-full ${route.status === 'Delayed' ? 'bg-error' : 'bg-primary'}`}
                              style={{ width: `${(route.filled / route.capacity) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-lg">
                        <Badge tone={routeStatusTone[route.status]} variant="ribbon">
                          {route.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex flex-col gap-lg">
            <Card padding="lg">
              <h3 className="font-headline-md text-headline-md text-primary mb-md">Selected Route Fleet</h3>
              <div className="flex items-center gap-lg mb-lg">
                <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[32px]">airport_shuttle</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md">Vehicle ID: {selectedFleet.vehicleId}</p>
                  <p className="font-body-md text-on-surface-variant">{selectedFleet.model}</p>
                </div>
              </div>
              <div className="space-y-md">
                <div className="flex items-center justify-between border-b border-outline/10 pb-sm">
                  <span className="font-label-sm text-outline">Driver</span>
                  <span className="font-label-md">{selectedFleet.driver}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline/10 pb-sm">
                  <span className="font-label-sm text-outline">License Status</span>
                  <span className="text-secondary font-label-md flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {selectedFleet.licenseNote}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-outline">Last Inspection</span>
                  <span className="font-label-md">{selectedFleet.lastInspection}</span>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="flex-1">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-headline-md text-headline-md text-primary">Student Mapping</h3>
                <button className="text-secondary font-label-md hover:underline">View All</button>
              </div>
              <div className="space-y-md">
                {studentMapping.map((student) => (
                  <div key={student.name} className="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline/10">
                    <div className="flex items-center gap-md">
                      <Avatar size="sm" fallbackInitials={student.initials} alt={student.name} />
                      <div>
                        <p className="font-label-md">{student.name}</p>
                        <p className="font-label-sm text-on-surface-variant">{student.meta}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-surface-container transition-colors rounded">
                      <span className="material-symbols-outlined text-primary">edit</span>
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full justify-center mt-lg border-dashed" iconLeft="person_add">
                Map New Student
              </Button>
            </Card>
          </div>
        </div>

        <Card padding="lg" className="relative overflow-hidden bg-surface-container-high min-h-80 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2e004a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-lg left-lg z-10 bg-surface-container-lowest/90 backdrop-blur p-md rounded-lg shadow-md border border-outline/10">
            <h4 className="font-headline-md text-body-md text-primary mb-xs">Real-time Route Monitor</h4>
            <div className="flex items-center gap-sm text-on-surface-variant">
              <span className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
              <span className="font-label-sm">Tracking 12 Active Buses</span>
            </div>
          </div>
          <div className="relative z-0 text-center">
            <span className="material-symbols-outlined text-[64px] text-primary/20">map</span>
            <p className="font-label-md text-on-surface-variant mt-md">Interactive Map Interface Loading...</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
