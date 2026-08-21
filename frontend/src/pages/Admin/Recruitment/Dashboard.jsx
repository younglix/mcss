import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import { stats, columns, jobPostings, jobStatusTone } from './recruitmentData.js';

export default function AdminRecruitmentDashboard() {
  const [view, setView] = useState('kanban');

  return (
    <AppShell portalId="admin" pageTitle="Recruitment Admin" user={{ name: 'HR Office' }}>
      <div className="space-y-lg sm:space-y-xl">
        <div className="flex justify-between items-end flex-wrap gap-lg">
          <PageHeader title="Applicant Tracking System" subtitle="HR & Staff · Recruitment" className="flex-1" />
          <div className="flex items-center bg-surface-container-lowest border border-outline/20 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-md py-2 rounded font-label-md text-label-md transition-all ${view === 'kanban' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              Kanban View
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-md py-2 rounded font-label-md text-label-md transition-all ${view === 'table' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              Table View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg" className="hover:border-primary/30 transition-all">
              <p className="text-on-surface-variant font-label-md text-label-md mb-xs">{stat.label}</p>
              <div className="flex items-center justify-between">
                <span className="font-headline-xl text-headline-xl text-primary leading-none">{stat.value}</span>
                <span className="material-symbols-outlined text-primary/20 text-4xl">{stat.icon}</span>
              </div>
              <div className="mt-md text-label-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>{stat.note}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="overflow-x-auto pb-lg">
          <div className="flex gap-lg min-w-300">
            {columns.map((column) => (
              <div key={column.key} className="flex-1 min-w-70">
                <div className="flex items-center justify-between mb-md px-1">
                  <h3 className="font-label-md text-label-md text-primary flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${column.dotTone}`} />
                    {column.label.toUpperCase()}
                    <span className="text-on-surface-variant font-normal">({column.count})</span>
                  </h3>
                  <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_horiz</button>
                </div>

                {column.archive ? (
                  <div className="bg-surface-container-low/50 rounded-lg border-2 border-dashed border-outline/20 flex flex-col p-lg items-center justify-center text-on-surface-variant gap-2 min-h-40">
                    <span className="material-symbols-outlined text-4xl opacity-20">archive</span>
                    <p className="font-label-sm text-label-sm">Archive Drop Zone</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-md">
                    {column.cards.map((candidate) => (
                      <Card key={candidate.name} padding="sm" className={candidate.urgent ? 'border-l-4 border-l-primary' : ''}>
                        <div className="flex justify-between items-start mb-sm">
                          <div className="flex flex-col">
                            <span className="font-label-md text-primary">{candidate.name}</span>
                            <span className="text-label-sm text-on-surface-variant">{candidate.role}</span>
                          </div>
                          {candidate.initials && <Avatar size="sm" fallbackInitials={candidate.initials} alt={candidate.name} />}
                        </div>

                        {candidate.tag && (
                          <div className="flex items-center gap-sm mb-md">
                            <span className="bg-secondary-container text-on-secondary-container text-label-xs px-2 py-0.5 rounded-full font-bold uppercase">
                              {candidate.tag}
                            </span>
                            <span className="text-label-xs text-outline">{candidate.meta}</span>
                          </div>
                        )}

                        {candidate.note && (
                          <div className="bg-primary-container/10 text-primary text-[11px] p-2 rounded-md mb-md border border-primary/10">
                            <div className="flex items-center gap-2 font-bold mb-1">
                              <span className="material-symbols-outlined text-sm">calendar_today</span>
                              Interview Scheduled
                            </div>
                            <span className="opacity-80">{candidate.note}</span>
                          </div>
                        )}

                        {candidate.status && (
                          <div className="mb-md">
                            <Badge tone="tertiary">{candidate.status}</Badge>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-md border-t border-outline/10">
                          {candidate.expires ? (
                            <span className="text-label-xs text-outline italic">{candidate.expires}</span>
                          ) : (
                            <span className="text-label-xs text-outline">&nbsp;</span>
                          )}
                          {candidate.urgent ? (
                            <span className="text-label-xs font-bold text-primary uppercase">Urgent</span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">
                              {candidate.status ? 'check_circle' : 'attachment'}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="px-lg py-md border-b border-outline/10 flex justify-between items-center bg-surface-container-low">
            <h3 className="font-headline-md text-headline-md text-primary">Active Job Postings</h3>
            <Button variant="ghost" size="sm">
              View All Postings
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left border-collapse">
              <thead className="bg-primary text-on-primary font-label-sm">
                <tr>
                  <th className="px-lg py-3 font-medium uppercase tracking-wider">Position Title</th>
                  <th className="px-lg py-3 font-medium uppercase tracking-wider">Department</th>
                  <th className="px-lg py-3 font-medium uppercase tracking-wider">Applicants</th>
                  <th className="px-lg py-3 font-medium uppercase tracking-wider">Status</th>
                  <th className="px-lg py-3 font-medium uppercase tracking-wider">Posted Date</th>
                  <th className="px-lg py-3 font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface-variant divide-y divide-outline/10">
                {jobPostings.map((job) => (
                  <tr key={job.title} className="hover:bg-surface-container transition-colors">
                    <td className="px-lg py-4">
                      <div className="font-bold text-primary">{job.title}</div>
                      <div className="text-label-sm">{job.meta}</div>
                    </td>
                    <td className="px-lg py-4">{job.department}</td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{job.applicants}</span>
                        {job.newApplicants > 0 && <span className="text-tertiary text-xs font-bold">({job.newApplicants} New)</span>}
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <Badge tone={jobStatusTone[job.status]}>{job.status}</Badge>
                    </td>
                    <td className="px-lg py-4">{job.posted}</td>
                    <td className="px-lg py-4">
                      <button className="p-1 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="p-1 hover:text-error transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
