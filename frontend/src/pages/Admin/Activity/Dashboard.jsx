import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { stats, clubs, totalClubs, featuredEvent, events, houses, grades, participationLog, totalEntries } from './activityData.js';

const activityTone = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
};

export default function AdminActivityDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Activity Admin" user={{ name: 'Activity Coordinator' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Extracurricular Participation"
          subtitle="Activity Coordinator Dashboard · Term 2, 2024"
          actions={
            <Button variant="primary" iconLeft="add">
              New Entry
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg" className={`flex flex-col justify-center border-l-4 ${stat.tone.split(' ')[0]}`}>
              <span className="text-label-sm font-label-sm uppercase text-outline">{stat.label}</span>
              <span className={`text-headline-lg font-headline-lg ${stat.tone.split(' ')[1]}`}>{stat.value}</span>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <Card padding="none" className="lg:col-span-4 flex flex-col overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10">
              <h3 className="font-label-md text-label-md text-primary flex items-center">
                <span className="material-symbols-outlined mr-2 text-sm">groups_2</span> Active Clubs
              </h3>
            </div>
            <div className="p-lg space-y-md flex-1">
              {clubs.map((club) => (
                <div key={club.name} className="flex items-center p-md bg-surface-container-lowest border border-outline/10 rounded-xl hover:shadow-sm transition-all group">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-lg mr-md shrink-0 ${club.tone}`}>
                    <span className="material-symbols-outlined">{club.icon}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-headline-md text-sm truncate">{club.name}</h4>
                    <p className="font-body-md text-xs text-outline">{club.meta}</p>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              ))}
            </div>
            <div className="p-lg pt-0">
              <button className="w-full text-center py-2 text-label-sm font-label-sm text-primary hover:underline">View All {totalClubs} Clubs</button>
            </div>
          </Card>

          <Card padding="none" className="lg:col-span-8 flex flex-col overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h3 className="font-label-md text-label-md text-primary flex items-center">
                <span className="material-symbols-outlined mr-2 text-sm">calendar_month</span> Inter-House Events
              </h3>
              <div className="flex items-center gap-sm">
                <button className="p-1 hover:bg-surface-container rounded">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="font-label-sm text-label-sm">October 2024</span>
                <button className="p-1 hover:bg-surface-container rounded">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg flex-grow">
              <div className="bg-primary text-on-primary rounded-2xl overflow-hidden flex flex-col justify-between p-md">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-tertiary-container text-on-tertiary-container text-label-xs font-bold px-3 py-1 rounded-full uppercase tracking-tight flex items-center">
                      <span className="material-symbols-outlined text-[12px] mr-1">priority_high</span>
                      {featuredEvent.priority}
                    </span>
                    <span className="text-label-sm font-label-sm opacity-70">{featuredEvent.date}</span>
                  </div>
                  <h4 className="font-headline-md text-md mb-1">{featuredEvent.title}</h4>
                  <p className="font-body-md text-xs opacity-80 line-clamp-2">{featuredEvent.description}</p>
                </div>
                <div className="flex justify-between items-center mt-md">
                  <span className="material-symbols-outlined text-3xl opacity-30">sports</span>
                  <button className="text-on-primary font-label-sm text-xs hover:underline">Manage Staff</button>
                </div>
              </div>
              <div className="space-y-md overflow-y-auto max-h-90 pr-2">
                {events.map((event) => (
                  <div
                    key={event.title}
                    className={`flex gap-md items-start p-md rounded-xl transition-all cursor-pointer ${
                      event.urgent ? 'bg-tertiary-container/10 border border-tertiary-container/30' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className={`block font-headline-lg text-xl leading-none ${event.urgent ? 'text-tertiary' : 'text-primary'}`}>{event.day}</span>
                      <span className={`block font-label-sm text-label-xs uppercase ${event.urgent ? 'text-tertiary' : 'text-outline'}`}>{event.month}</span>
                    </div>
                    <div className="flex-grow">
                      <h5 className="font-label-md text-on-surface leading-tight">{event.title}</h5>
                      <p className={`text-xs font-body-md ${event.urgent ? 'text-tertiary font-bold' : 'text-outline'}`}>{event.meta}</p>
                    </div>
                    <span className={`material-symbols-outlined ${event.urgent ? 'text-tertiary' : 'text-outline'}`}>
                      {event.urgent ? 'warning' : 'event'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-md">
            <h3 className="font-label-md text-label-md text-primary flex items-center">
              <span className="material-symbols-outlined mr-2 text-sm">history_edu</span> Participation Log
            </h3>
            <div className="flex flex-wrap gap-sm">
              <select className="mcss-field mcss-field-compact px-md">
                {houses.map((house) => (
                  <option key={house}>{house}</option>
                ))}
              </select>
              <select className="mcss-field mcss-field-compact px-md">
                {grades.map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
              <Button variant="secondary" size="sm">
                Export CSV
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left border-collapse">
              <thead className="bg-secondary-container/10 border-b border-outline/10">
                <tr>
                  <th className="px-lg py-4 font-label-md text-sm text-secondary">Student Name</th>
                  <th className="px-lg py-4 font-label-md text-sm text-secondary">ID Number</th>
                  <th className="px-lg py-4 font-label-md text-sm text-secondary">Activity</th>
                  <th className="px-lg py-4 font-label-md text-sm text-secondary">Role</th>
                  <th className="px-lg py-4 font-label-md text-sm text-secondary">Points Earned</th>
                  <th className="px-lg py-4 font-label-md text-sm text-secondary text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {participationLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-4 font-headline-md text-sm">{entry.name}</td>
                    <td className="px-lg py-4 font-body-md text-sm text-outline">{entry.id}</td>
                    <td className="px-lg py-4">
                      <span className={`px-3 py-1 rounded-full text-label-xs font-bold uppercase ${activityTone[entry.tone]}`}>{entry.activity}</span>
                    </td>
                    <td className="px-lg py-4 font-body-md text-sm">{entry.role}</td>
                    <td className="px-lg py-4">
                      <div className="flex items-center text-tertiary font-bold">
                        <span className="material-symbols-outlined text-sm mr-1">star</span> {entry.points}
                      </div>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-all">
                        <span className="material-symbols-outlined">edit_note</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-lg flex items-center justify-between border-t border-outline/10 bg-surface-container-low">
            <span className="font-body-md text-xs text-outline">Showing 1-{participationLog.length} of {totalEntries.toLocaleString()} entries</span>
            <div className="flex gap-sm">
              <button className="px-4 py-1 border border-outline/20 rounded-lg text-xs font-label-md hover:bg-surface-container-lowest">Previous</button>
              <button className="px-4 py-1 bg-primary text-on-primary rounded-lg text-xs font-label-md">Next</button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
