import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { stats, securityStatus, visitorLog, visitorStatusTone, totalVisitors, inquiries } from './receptionData.js';

export default function AdminReceptionDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Reception Admin" user={{ name: 'Admin Staff' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Front Desk & Reception"
          subtitle="Manage campus visitors, track academic inquiries, and maintain security logs."
          actions={
            <Button variant="primary" iconLeft="add_circle">
              Record Visitor
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg" className="flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <span className="font-label-md text-label-md text-on-surface-variant">{stat.label}</span>
                <span className="material-symbols-outlined text-primary">{stat.icon}</span>
              </div>
              <div>
                <div className="font-headline-xl text-headline-xl text-primary">{stat.value}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">{stat.helper}</div>
              </div>
            </Card>
          ))}
          <Card padding="lg" className="bg-primary text-on-primary border-none flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-label-md opacity-80">{securityStatus.label}</span>
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div>
              <div className="font-headline-md text-headline-md">{securityStatus.value}</div>
              <div className="font-label-sm text-label-sm opacity-80 mt-xs">{securityStatus.helper}</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg">
          <section className="xl:col-span-2 space-y-md">
            <div className="flex items-center justify-between flex-wrap gap-md">
              <h3 className="font-headline-md text-headline-md text-primary">Visitor Log</h3>
              <div className="flex gap-sm">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-md">search</span>
                  <input
                    className="mcss-field pl-10 pr-md"
                    placeholder="Search visitors..."
                    type="text"
                  />
                </div>
                <button className="p-2 border border-outline-variant rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
                </button>
              </div>
            </div>
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="py-md px-lg font-label-md text-label-md">Visitor Name</th>
                      <th className="py-md px-lg font-label-md text-label-md">Purpose</th>
                      <th className="py-md px-lg font-label-md text-label-md">Time In</th>
                      <th className="py-md px-lg font-label-md text-label-md">Time Out</th>
                      <th className="py-md px-lg font-label-md text-label-md">Host</th>
                      <th className="py-md px-lg font-label-md text-label-md">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md text-on-surface">
                    {visitorLog.map((visitor) => (
                      <tr key={visitor.name} className="border-b border-outline/10 hover:bg-surface-container-low transition-colors">
                        <td className="py-md px-lg font-semibold">{visitor.name}</td>
                        <td className="py-md px-lg">{visitor.purpose}</td>
                        <td className="py-md px-lg">{visitor.timeIn}</td>
                        <td className="py-md px-lg">{visitor.timeOut}</td>
                        <td className="py-md px-lg">{visitor.host}</td>
                        <td className="py-md px-lg">
                          <Badge tone={visitorStatusTone[visitor.status]}>{visitor.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-md bg-surface-container-low flex justify-between items-center">
                <span className="text-label-sm text-on-surface-variant">Showing 5 of {totalVisitors} entries</span>
                <div className="flex gap-sm">
                  <button className="px-3 py-1 border border-outline/20 rounded bg-surface-container-lowest text-label-sm hover:bg-surface transition-colors disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-primary text-on-primary rounded text-label-sm">1</button>
                  <button className="px-3 py-1 border border-outline/20 rounded bg-surface-container-lowest text-label-sm hover:bg-surface transition-colors">2</button>
                  <button className="px-3 py-1 border border-outline/20 rounded bg-surface-container-lowest text-label-sm hover:bg-surface transition-colors">Next</button>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Inquiry Log</h3>
              <button className="text-primary font-label-md hover:underline">View All</button>
            </div>
            <div className="space-y-md">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.title} padding="sm">
                  <div className="flex justify-between items-start mb-sm">
                    <Badge tone={inquiry.tone}>{inquiry.priority}</Badge>
                    <span className="text-label-sm text-on-surface-variant">{inquiry.time}</span>
                  </div>
                  <h4 className="font-label-md text-label-md text-on-surface">{inquiry.title}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 line-clamp-2">{inquiry.body}</p>
                  <div className="mt-md pt-md border-t border-outline/10 flex justify-between items-center">
                    <span className="text-label-sm text-on-surface-variant">By: {inquiry.by}</span>
                    <Button variant="primary" size="sm">
                      Respond
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
