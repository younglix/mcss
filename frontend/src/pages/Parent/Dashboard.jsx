import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import NotificationStrip from '../../components/ui/NotificationStrip.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import {
  parentName,
  children,
  attendance,
  latestResult,
  feeStatus,
  upcomingEvents,
  principalMessage,
} from './dashboardData.js';

export default function ParentDashboard() {
  const [activeChildId, setActiveChildId] = useState(children[0].id);

  return (
    <AppShell portalId="parent" pageTitle="Parent Dashboard" user={{ name: parentName }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title={`Welcome back, ${parentName}`}
          subtitle="Manage your children's academic progress and records."
          actions={
            <ChildSwitcher
              children={children}
              activeId={activeChildId}
              onSelect={setActiveChildId}
              onAdd={() => {}}
            />
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          {/* Attendance */}
          <div className="md:col-span-4">
            <StatCard
              icon="calendar_month"
              iconTone="primary"
              label="Attendance · This Term"
              value={`${attendance.percent}%`}
              delta={{ direction: 'down', text: attendance.deltaText }}
              progress={{ percent: attendance.percent }}
              helperText={attendance.helperText}
            />
          </div>

          {/* Latest Result */}
          <Card padding="none" className="md:col-span-8 flex flex-col md:flex-row overflow-hidden">
            <div className="p-lg md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-outline/10 bg-surface-container-low/30">
              <div className="flex items-center gap-sm mb-sm text-secondary">
                <span className="material-symbols-outlined">trending_up</span>
                <span className="font-label-md text-label-md">Latest Assessment</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Term 2 Average</h3>
              <div className="text-5xl font-bold text-primary tracking-tight">
                {latestResult.termAverage}
                <span className="text-2xl font-medium opacity-50">%</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-md">Standing: {latestResult.standing}</p>
            </div>
            <div className="p-lg md:w-3/5 flex flex-col justify-between">
              <div className="space-y-md">
                {latestResult.subjects.map((subject) => (
                  <div key={subject.name} className="flex justify-between items-center">
                    <span className="font-body-md text-body-md">{subject.name}</span>
                    <span className="font-bold text-primary">{subject.score}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="mt-lg self-start px-0" iconRight="arrow_forward">
                View Detailed Transcript
              </Button>
            </div>
          </Card>

          {/* Fee Status */}
          <Card className="md:col-span-12 lg:col-span-6 flex items-center gap-lg">
            <div className="p-md bg-tertiary-container text-on-tertiary-container rounded-lg shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-md mb-xs flex-wrap">
                <h3 className="font-headline-md text-headline-md text-on-surface">Fee Status</h3>
                <Badge tone="warning" variant="ribbon">
                  {feeStatus.status}
                </Badge>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Outstanding Balance: <span className="font-bold text-primary">{feeStatus.outstandingBalance}</span>
              </p>
            </div>
            <Button variant="primary">Pay Now</Button>
          </Card>

          {/* Upcoming Events */}
          <Card className="md:col-span-12 lg:col-span-6">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Upcoming Events</h3>
              <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
            </div>
            <div className="space-y-md">
              {upcomingEvents.map((event) => (
                <div key={event.title} className="flex gap-md items-start">
                  <div className="flex flex-col items-center bg-surface-container px-sm py-xs rounded min-w-12.5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">{event.month}</span>
                    <span className="font-headline-sm text-headline-sm text-primary leading-none">{event.day}</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">{event.title}</h4>
                    <p className="text-xs text-on-surface-variant">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Principal message */}
          <div className="md:col-span-12">
            <NotificationStrip
              avatarUrl={principalMessage.avatarUrl}
              avatarAlt="Principal"
              title={principalMessage.senderName}
              message={principalMessage.message}
              actions={[
                { label: 'Dismiss', variant: 'ghost' },
                { label: 'Read Message', variant: 'secondary' },
              ]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
