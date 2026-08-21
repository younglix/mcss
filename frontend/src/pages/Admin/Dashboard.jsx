import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import {
  term,
  stats,
  performanceTrend,
  attendanceHeatmap,
  weekdays,
  recentAdmissions,
  facultySpotlight,
} from './dashboardData.js';

const heatmapTone = ['bg-outline-variant', 'bg-primary/40', 'bg-primary/70', 'bg-primary'];

export default function AdminDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Admin Dashboard" user={{ name: 'Admin User' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Academic Overview"
          subtitle={term}
          actions={
            <>
              <Button variant="secondary">Report</Button>
              <Button variant="primary" iconLeft="add">
                Enroll
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md sm:gap-lg">
          {stats.map((stat) => (
            <StatCard
              key={stat.key}
              icon={stat.icon}
              iconTone={stat.iconTone}
              label={stat.label}
              value={stat.value}
              delta={stat.delta}
              progress={stat.progress}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md sm:gap-lg">
          <Card padding="lg" className="lg:col-span-2 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-xl gap-md">
              <h4 className="font-headline-md text-headline-md text-primary">Academic Performance</h4>
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-label-sm text-label-sm">Science</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full bg-tertiary" />
                  <span className="font-label-sm text-label-sm">Arts</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 pl-8 pb-8">
              <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-label-xs text-outline py-2">
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                <path d={performanceTrend.sciencePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" />
                <path
                  d={performanceTrend.artsPath}
                  fill="none"
                  stroke="var(--color-tertiary)"
                  strokeDasharray="8 4"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute -bottom-2 inset-x-8 flex justify-between text-label-xs text-outline font-bold">
                {performanceTrend.weeks.map((week) => (
                  <span key={week}>{week}</span>
                ))}
              </div>
            </div>
          </Card>

          <Card padding="lg" className="flex flex-col">
            <div className="flex justify-between items-center mb-xl">
              <h4 className="font-headline-md text-headline-md text-primary">Weekly Attendance</h4>
              <span className="material-symbols-outlined text-outline">calendar_month</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1">
              {weekdays.map((day) => (
                <div key={day} className="text-label-xs text-center font-bold text-outline">
                  {day}
                </div>
              ))}
              {attendanceHeatmap.map((level, i) => (
                <div key={i} className={`aspect-square rounded-sm ${heatmapTone[level]}`} />
              ))}
            </div>
            <div className="mt-lg flex items-center justify-between">
              <p className="text-label-xs text-outline font-bold uppercase tracking-widest">Intensity</p>
              <div className="flex items-center gap-1">
                {heatmapTone.slice(1).map((tone) => (
                  <div key={tone} className={`w-2 h-2 rounded-sm ${tone}`} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md sm:gap-lg">
          <Card padding="none" className="overflow-hidden">
            <div className="px-lg py-md border-b border-outline/10 bg-surface-container-low flex justify-between items-center">
              <h5 className="font-label-md text-label-md text-primary uppercase font-bold">Recent Admissions</h5>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-100 text-left">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 text-label-xs font-bold uppercase tracking-widest">Student Name</th>
                    <th className="px-lg py-3 text-label-xs font-bold uppercase tracking-widest">Class</th>
                    <th className="px-lg py-3 text-label-xs font-bold uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10 font-body-md text-[13px]">
                  {recentAdmissions.map((student) => (
                    <tr key={student.name} className="hover:bg-surface transition-colors">
                      <td className="px-lg py-4 font-semibold">{student.name}</td>
                      <td className="px-lg py-4 text-on-surface-variant">{student.className}</td>
                      <td className="px-lg py-4">
                        <Badge tone={student.status === 'Verified' ? 'success' : 'warning'} variant="ribbon">
                          {student.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex justify-between items-center mb-xl">
              <h4 className="font-headline-md text-headline-md text-primary">Faculty Spotlight</h4>
              <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
            </div>
            <div className="space-y-md">
              {facultySpotlight.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-md p-md border border-outline/10 rounded-lg hover:border-primary transition-all"
                >
                  <img src={person.photoUrl} alt={person.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">{person.name}</p>
                    <p className="text-label-xs text-outline truncate uppercase">{person.role}</p>
                  </div>
                  <Badge tone={person.badge === 'Top' ? 'primary' : 'secondary'} variant="ribbon" className="shrink-0">
                    {person.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
