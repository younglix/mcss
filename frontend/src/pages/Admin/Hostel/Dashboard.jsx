import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { stats, blocks, allocations, statusTone, waitlist } from './hostelData.js';

function initialsFor(name) {
  return name.match(/\b\w/g)?.slice(0, 2).join('').toUpperCase();
}

export default function AdminHostelDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Hostel Admin" user={{ name: 'Hostel Manager' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Hostel Management"
          subtitle="Occupancy, room allocations, and the boarding waitlist."
          actions={
            <Button variant="primary" iconLeft="add">
              Assign Bed
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md sm:gap-lg">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              padding="lg"
              className={`flex flex-col justify-between h-32 ${stat.invert ? 'bg-primary text-on-primary border-none' : ''}`}
            >
              <span className={`font-label-sm text-label-sm uppercase tracking-wider ${stat.invert ? 'opacity-70' : 'text-on-surface-variant'}`}>
                {stat.label}
              </span>
              <div className="flex items-baseline gap-xs">
                <span className={`font-headline-xl text-headline-xl ${stat.invert ? '' : stat.tone === 'secondary' ? 'text-secondary' : stat.tone === 'tertiary' ? 'text-tertiary' : 'text-primary'}`}>
                  {stat.value}
                </span>
                <span className={`font-label-md text-label-md ${stat.invert ? 'opacity-70' : 'text-on-surface-variant'}`}>{stat.unit}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <section className="lg:col-span-8 space-y-lg">
            <div className="flex justify-between items-end flex-wrap gap-md">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary">Room &amp; Bed Allocations</h3>
                <p className="text-on-surface-variant">Live status of hostel blocks and current residents.</p>
              </div>
              <select className="mcss-field mcss-field-compact px-md">
                {blocks.map((block) => (
                  <option key={block}>{block}</option>
                ))}
              </select>
            </div>

            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead className="bg-primary text-on-primary">
                    <tr>
                      <th className="p-lg font-label-md text-label-md">Hostel Block</th>
                      <th className="p-lg font-label-md text-label-md">Room No.</th>
                      <th className="p-lg font-label-md text-label-md">Bed No.</th>
                      <th className="p-lg font-label-md text-label-md">Occupant Name</th>
                      <th className="p-lg font-label-md text-label-md">Status</th>
                      <th className="p-lg font-label-md text-label-md">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md divide-y divide-outline/10">
                    {allocations.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors group">
                        <td className="p-lg font-medium text-primary">{row.block}</td>
                        <td className="p-lg">{row.room}</td>
                        <td className="p-lg">{row.bed}</td>
                        <td className="p-lg">
                          {row.occupant ? (
                            <div className="flex items-center gap-sm">
                              <Avatar size="sm" fallbackInitials={row.initials} alt={row.occupant} />
                              <span>{row.occupant}</span>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-lg">
                          <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                        </td>
                        <td className="p-lg">
                          {row.status === 'Vacant' ? (
                            <button className="text-primary font-label-sm hover:underline">Assign Now</button>
                          ) : (
                            <button className="p-1 hover:text-primary transition-colors">
                              <span className="material-symbols-outlined">edit_note</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <aside className="lg:col-span-4 space-y-lg">
            <div className="flex items-end justify-between">
              <h3 className="font-headline-md text-headline-md text-primary">Boarding Waitlist</h3>
              <a className="text-primary font-label-sm hover:underline" href="#">
                View All
              </a>
            </div>
            <Card padding="lg" className="bg-surface-container-low flex flex-col gap-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-md">search</span>
                <input
                  className="mcss-field w-full pl-xl pr-md"
                  placeholder="Search unassigned students..."
                  type="text"
                />
              </div>
              <div className="space-y-sm">
                {waitlist.map((student) => (
                  <div
                    key={student.name}
                    className="bg-surface-container-lowest p-md rounded-xl border border-outline/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-md">
                      <Avatar fallbackInitials={initialsFor(student.name)} alt={student.name} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline-md text-body-md text-primary truncate">{student.name}</h4>
                        <p className="text-on-surface-variant text-sm truncate">{student.meta}</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                    </div>
                    {(student.tags.length > 0 || student.alert) && (
                      <div className="mt-md flex gap-sm flex-wrap">
                        {student.tags.map((tag) => (
                          <span key={tag} className="bg-surface-container px-sm py-1 rounded text-label-xs font-bold text-on-surface-variant uppercase">
                            {tag}
                          </span>
                        ))}
                        {student.alert && (
                          <span className="bg-tertiary-container text-on-tertiary-container px-sm py-1 rounded text-label-xs font-bold uppercase">
                            {student.alert}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full justify-center mt-xs" iconLeft="group_add">
                Add New Boarder
              </Button>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
