import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { stats, applicants, totalApplicants } from './applicantsData.js';

export default function SuperAdminApplicantApprovals() {
  return (
    <AppShell portalId="superAdmin" pageTitle="Applicant Approvals" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Applicant Approval Queue"
          subtitle="Review and manage pending admission applications for the 2024/2025 academic session."
          actions={
            <>
              <Button variant="secondary" className="bg-secondary-container text-on-secondary-container border-none" iconLeft="check_circle">
                Bulk Approve
              </Button>
              <Button variant="primary" iconLeft="file_download">
                Export List
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <Card key={stat.label} padding="sm" className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">{stat.label}</p>
                <h3 className="font-headline-md text-headline-md text-primary">{stat.value}</h3>
              </div>
              <div className={`p-sm rounded-full shrink-0 ${stat.tone}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        <Card padding="none" className="overflow-hidden flex flex-col">
          <div className="px-gutter py-md bg-primary flex flex-wrap items-center justify-between gap-md">
            <h3 className="font-label-md text-label-md text-on-primary">PENDING APPLICATIONS</h3>
            <div className="flex items-center gap-lg">
              <div className="flex items-center gap-xs text-on-primary/80 font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                <span>Filter by Class</span>
              </div>
              <div className="flex items-center gap-xs text-on-primary/80 font-label-sm text-label-sm border-l border-on-primary/20 pl-lg">
                <span className="material-symbols-outlined text-sm">sort</span>
                <span>Sort by Date</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 border-collapse">
              <thead className="bg-surface-container-low border-b border-outline/10">
                <tr>
                  <th className="p-md text-left w-12">
                    <input type="checkbox" />
                  </th>
                  <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Applicant Name</th>
                  <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Intended Class</th>
                  <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Submission Date</th>
                  <th className="p-md text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Status</th>
                  <th className="p-md text-right font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {applicants.map((applicant) => (
                  <tr key={applicant.ref} className="hover:bg-surface-container-low transition-colors group">
                    <td className="p-md">
                      <input type="checkbox" />
                    </td>
                    <td className="p-md">
                      <div className="flex items-center gap-md">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold font-headline-md text-sm shrink-0 ${applicant.tone}`}>
                          {applicant.initials}
                        </div>
                        <div>
                          <p className="font-body-md text-body-md text-primary font-semibold">{applicant.name}</p>
                          <p className="font-label-sm text-label-sm text-outline">Ref: {applicant.ref}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-md font-body-md text-body-md text-on-surface">{applicant.className}</td>
                    <td className="p-md font-body-md text-body-md text-on-surface">{applicant.date}</td>
                    <td className="p-md">
                      <Badge tone="warning">Pending</Badge>
                    </td>
                    <td className="p-md text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button className="p-2 text-outline hover:text-primary transition-colors" title="View Details">
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button className="p-2 text-outline hover:text-secondary transition-colors" title="Approve">
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                        <button className="p-2 text-outline hover:text-error transition-colors" title="Reject">
                          <span className="material-symbols-outlined">cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-md bg-surface-container-low border-t border-outline/10 flex items-center justify-between">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Showing 1 to {applicants.length} of {totalApplicants} results
            </p>
            <div className="flex items-center gap-sm">
              <button className="h-8 w-8 rounded flex items-center justify-center border border-outline/20 text-outline hover:bg-surface-container-lowest transition-all disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="h-8 w-8 rounded flex items-center justify-center bg-primary text-on-primary font-label-sm text-label-sm">1</button>
              <button className="h-8 w-8 rounded flex items-center justify-center border border-outline/20 text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-lowest">
                2
              </button>
              <button className="h-8 w-8 rounded flex items-center justify-center border border-outline/20 text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-lowest">
                3
              </button>
              <button className="h-8 w-8 rounded flex items-center justify-center border border-outline/20 text-outline hover:bg-surface-container-lowest transition-all">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
