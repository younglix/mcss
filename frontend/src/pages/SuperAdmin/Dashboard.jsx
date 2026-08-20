import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { stats, topSchools, schoolStatusTone, totalInstitutions, activityFeed, growth } from './dashboardData.js';

const activityIconTone = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
};

function InstitutionSelector() {
  return (
    <button className="flex items-center gap-sm px-md py-1.5 bg-surface-container-low rounded-full border border-outline/20 hover:border-primary transition-all">
      <span className="material-symbols-outlined text-primary text-body-md">hub</span>
      <span className="font-label-md text-label-md text-on-surface-variant">All Institutions</span>
      <span className="material-symbols-outlined text-body-md">expand_more</span>
    </button>
  );
}

export default function SuperAdminDashboard() {
  return (
    <AppShell portalId="superAdmin" pageTitle="Super Admin Dashboard" user={{ name: 'System Root' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Platform Overview" actions={<InstitutionSelector />} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <Card padding="lg" className="hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-on-primary">domain</span>
              </div>
              <span className="text-on-surface-variant font-label-md text-label-md">{stats.schools.note}</span>
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Schools</h3>
            <p className="font-headline-lg text-headline-lg text-primary">{stats.schools.value}</p>
            <div className="mt-4 w-full bg-surface-container h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${stats.schools.progress}%` }} />
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary/10 rounded-xl group-hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined text-secondary group-hover:text-on-secondary">school</span>
              </div>
              <span className="text-on-surface-variant font-label-md text-label-md">{stats.students.note}</span>
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Global Students</h3>
            <p className="font-headline-lg text-headline-lg text-secondary">{stats.students.value}</p>
            <div className="mt-4 w-full bg-surface-container h-1 rounded-full overflow-hidden">
              <div className="bg-secondary h-full" style={{ width: `${stats.students.progress}%` }} />
            </div>
          </Card>

          <Card padding="lg" className="bg-tertiary-container text-on-tertiary-container border-none relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-on-tertiary-container/15 rounded-xl">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="bg-on-tertiary-container/15 font-label-sm text-label-sm px-2 py-0.5 rounded uppercase font-bold">Action Required</span>
              </div>
              <h3 className="font-label-md text-label-md opacity-80 uppercase tracking-wider mb-1">Pending Admissions</h3>
              <p className="font-headline-lg text-headline-lg">{stats.admissions.value}</p>
              <p className="mt-4 font-body-md text-body-md opacity-80 underline cursor-pointer">{stats.admissions.note} →</p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10">verified_user</span>
          </Card>

          <Card padding="lg" className="hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-error-container rounded-xl">
                <span className="material-symbols-outlined text-on-error-container">dns</span>
              </div>
              <span className="flex items-center gap-1 text-secondary font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> {stats.latency.note}
              </span>
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Server Latency</h3>
            <p className="font-headline-lg text-headline-lg text-on-surface">{stats.latency.value}</p>
            <div className="mt-4 flex gap-1 items-end h-8">
              {stats.latency.bars.map((h, i) => (
                <div key={i} className={`w-full rounded-t-sm ${h >= 70 ? 'bg-primary' : 'bg-outline/20'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-xl">
          <div className="xl:col-span-2 space-y-lg">
            <div className="flex items-center justify-between flex-wrap gap-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">Top Performing Schools</h2>
              <Button variant="primary" iconLeft="add">
                Provision New School
              </Button>
            </div>
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md min-w-200">
                  <thead className="bg-primary text-on-primary">
                    <tr>
                      <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider">Institution Name</th>
                      <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider">Students</th>
                      <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {topSchools.map((school) => (
                      <tr key={school.name} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${school.tone}`}>{school.initials}</div>
                            <div>
                              <p className="font-bold text-on-surface">{school.name}</p>
                              <p className="text-xs text-on-surface-variant">{school.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-body-lg text-body-lg">{school.students.toLocaleString()}</td>
                        <td className="px-6 py-5 font-body-lg text-body-lg">{school.staff}</td>
                        <td className="px-6 py-5">
                          <Badge tone={schoolStatusTone[school.status]}>{school.status}</Badge>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 text-outline hover:text-primary transition-all">
                            <span className="material-symbols-outlined">settings_suggest</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-surface-container-low text-center">
                <button className="text-primary font-label-md text-label-md hover:underline">View All {totalInstitutions} Institutions</button>
              </div>
            </Card>
          </div>

          <div className="space-y-lg">
            <h2 className="font-headline-lg text-headline-lg text-primary">System Activity</h2>
            <Card padding="lg" className="max-h-125 overflow-y-auto">
              <div className="space-y-6">
                {activityFeed.map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i < activityFeed.length - 1 && <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-outline/10" />}
                    <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 border-surface-container-lowest shrink-0 ${activityIconTone[item.tone]}`}>
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md text-on-surface">
                        <span className="font-bold">{item.actor}</span> {item.text}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">{item.time}</p>
                      {item.quote && (
                        <div className="mt-2 p-3 bg-surface-container-low rounded-lg text-body-md italic border-l-4 border-primary">{item.quote}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center py-xl border-t border-outline/10">
          <div className="space-y-lg">
            <h3 className="font-headline-xl text-headline-xl text-primary leading-tight">{growth.heading}</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{growth.body}</p>
            <div className="flex flex-wrap gap-md">
              <Button variant="primary" className="bg-secondary">
                Download Annual Report
              </Button>
              <Button variant="secondary">Growth Strategy</Button>
            </div>
          </div>
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden border border-outline/10 bg-primary/5 flex items-center justify-center">
            <div className="text-center p-lg bg-surface-container-lowest/90 rounded-lg max-w-72 shadow-xl">
              <span className="material-symbols-outlined text-primary text-[48px] mb-2">auto_graph</span>
              <p className="font-headline-md text-headline-md text-primary">{growth.statValue}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">{growth.statLabel}</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
