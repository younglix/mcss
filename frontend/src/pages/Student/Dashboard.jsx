import AppShell from '../../components/layout/AppShell.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import {
  student,
  termAverage,
  attendance,
  outstandingFees,
  upcomingExams,
  announcements,
  quickActions,
} from './dashboardData.js';

export default function StudentDashboard() {
  return (
    <AppShell portalId="student" pageTitle="Student Dashboard" user={{ name: student.fullName, avatarUrl: student.photoUrl }}>
      <div className="space-y-lg sm:space-y-xl">
        {/* Welcome banner */}
        <Card padding="lg" className="relative overflow-hidden flex flex-col md:flex-row items-center gap-lg">
          <Badge tone="secondary" variant="ribbon" className="absolute top-0 right-0">
            Active Student
          </Badge>
          <div className="w-32 h-32 rounded-lg border-4 border-primary/10 overflow-hidden shrink-0">
            <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Welcome back, {student.firstName}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {student.fullName} · <span className="font-bold text-secondary">{student.className}</span>
            </p>
            <div className="flex flex-wrap gap-sm mt-md justify-center md:justify-start">
              <span className="bg-surface-container px-md py-xs rounded-full font-label-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-body-md">id_card</span> {student.studentId}
              </span>
              <span className="bg-surface-container px-md py-xs rounded-full font-label-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-body-md">location_on</span> {student.house}
              </span>
            </div>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <StatCard
            icon="analytics"
            iconTone="secondary"
            label={`Term Average · ${termAverage.term}`}
            value={`${termAverage.percent}%`}
            delta={{ direction: 'up', text: termAverage.deltaText }}
            progress={{ percent: termAverage.percent }}
          />
          <StatCard
            icon="calendar_month"
            iconTone="tertiary"
            label="Attendance · Latest Month"
            value={`${attendance.percent}%`}
            helperText={attendance.status}
            progress={{ percent: (attendance.monthsFilled / attendance.monthsTotal) * 100 }}
          />
          <StatCard
            icon="account_balance_wallet"
            iconTone="primary"
            label="Outstanding Fees"
            value={outstandingFees.amount}
            valueBadge={{ text: outstandingFees.status, tone: 'success' }}
            helperText={`Receipt No: ${outstandingFees.receiptNo}`}
          />
        </div>

        {/* Exams + announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <Card padding="none" className="lg:col-span-2 overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">event_note</span>
                <h2 className="font-headline-md text-headline-md text-primary">Upcoming Exams</h2>
              </div>
              <Button variant="ghost" size="sm">
                Full Schedule
              </Button>
            </div>
            <div className="p-lg overflow-x-auto">
              <table className="w-full min-w-140 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="p-md font-label-md text-label-md">Subject</th>
                    <th className="p-md font-label-md text-label-md">Date</th>
                    <th className="p-md font-label-md text-label-md">Time</th>
                    <th className="p-md font-label-md text-label-md">Venue</th>
                    <th className="p-md font-label-md text-label-md">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-outline/10">
                  {upcomingExams.map((exam) => (
                    <tr key={exam.subject} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-md font-bold text-on-surface">{exam.subject}</td>
                      <td className="p-md">{exam.date}</td>
                      <td className="p-md">{exam.time}</td>
                      <td className="p-md">{exam.venue}</td>
                      <td className="p-md">
                        <Badge tone="secondary">Upcoming</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="none" className="lg:col-span-1 flex flex-col">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex items-center gap-sm">
              <span className="material-symbols-outlined text-tertiary">campaign</span>
              <h2 className="font-headline-md text-headline-md text-tertiary">Announcements</h2>
            </div>
            <div className="p-lg flex-1 space-y-md">
              {announcements.map((item) => (
                <div
                  key={item.title}
                  className={`relative pl-md border-l-2 py-1 ${
                    item.highlighted ? 'border-tertiary-fixed-dim' : 'border-outline/20 opacity-70'
                  }`}
                >
                  {item.highlighted && <div className="absolute -left-1.25 top-1 w-2 h-2 rounded-full bg-tertiary" />}
                  <p
                    className={`text-xs font-bold uppercase mb-1 ${
                      item.highlighted ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant'
                    }`}
                  >
                    {item.timestamp}
                  </p>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-xs">{item.title}</h4>
                  <p className="text-sm text-on-surface-variant line-clamp-2">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="p-md border-t border-outline/10">
              <Button variant="ghost" className="w-full justify-center" iconRight="open_in_new">
                View All Feed
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="flex flex-col items-center justify-center p-lg bg-surface-container-lowest border border-outline/10 rounded-lg hover:border-primary transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-md group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">
                  {action.icon}
                </span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
