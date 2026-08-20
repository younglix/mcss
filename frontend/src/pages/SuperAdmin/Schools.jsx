import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { stats, branches, branchStatusTone, auditLog, auditStatusTone } from './schoolsData.js';

export default function SuperAdminSchools() {
  return (
    <AppShell portalId="superAdmin" pageTitle="School Management" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="School & Tenant Management"
          subtitle="Global oversight of institutional branches and administrative hierarchy."
          actions={
            <Button variant="primary" iconLeft="add_business">
              Add New School
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg" className="flex flex-col gap-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">{stat.label}</span>
              <span className={`font-headline-xl text-headline-xl ${stat.tone || 'text-primary'}`}>{stat.value}</span>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {branches.map((branch) => (
            <Card key={branch.branchId} padding="none" className="overflow-hidden flex flex-col">
              <div className="h-24 bg-surface-container-low px-lg flex items-center justify-between">
                <div className="flex items-center gap-md min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-on-primary font-bold shrink-0 ${branch.tone}`}>
                    {branch.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-headline-md text-headline-md text-on-surface truncate">{branch.name}</h4>
                    <span className="font-label-sm text-label-sm text-outline">Branch ID: {branch.branchId}</span>
                  </div>
                </div>
                <Badge tone={branchStatusTone[branch.status]} variant="ribbon" className="shrink-0">
                  {branch.status}
                </Badge>
              </div>
              <div className="p-lg grid grid-cols-2 gap-lg border-b border-outline/10">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">School Admin</span>
                  <span className="font-body-md text-body-md font-semibold">{branch.admin}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Total Students</span>
                  <span className="font-body-md text-body-md font-semibold">{branch.students}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Status</span>
                  <div className={`flex items-center gap-xs ${branch.statusTone}`}>
                    <span className="material-symbols-outlined text-body-md">{branch.statusIcon}</span>
                    <span className="font-body-md text-body-md">{branch.statusText}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">{branch.lastField[0]}</span>
                  <span className="font-body-md text-body-md">{branch.lastField[1]}</span>
                </div>
              </div>
              <div className="p-md flex justify-end gap-md flex-wrap">
                <button className="flex items-center gap-xs font-label-md text-label-md text-secondary hover:text-primary transition-all p-2">
                  <span className="material-symbols-outlined">palette</span> Edit Branding
                </button>
                <button className="flex items-center gap-xs font-label-md text-label-md text-secondary hover:text-primary transition-all p-2">
                  <span className="material-symbols-outlined">person_add</span> Assign Admin
                </button>
                <button className="bg-surface-container-high text-on-surface-variant font-bold px-md py-2 rounded-lg text-label-sm hover:bg-surface-container-highest transition-all">
                  Manage Node
                </button>
              </div>
            </Card>
          ))}

          <button className="border-2 border-dashed border-outline/20 rounded-lg flex flex-col items-center justify-center p-xl gap-md group hover:bg-surface-container-low transition-all min-h-70">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
              <span className="material-symbols-outlined text-4xl">add_circle</span>
            </div>
            <div className="text-center">
              <h4 className="font-headline-md text-headline-md text-outline group-hover:text-primary transition-all">Establish New Branch</h4>
              <p className="font-body-md text-body-md text-outline max-w-72">Initialize a new secure tenant environment for a new school location.</p>
            </div>
          </button>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="bg-primary px-lg py-md flex justify-between items-center">
            <h4 className="font-label-md text-label-md text-on-primary uppercase tracking-widest">Recent Administrative Actions</h4>
            <span className="material-symbols-outlined text-on-primary">history</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline/10">
                  <th className="px-lg py-md text-left font-label-sm text-label-sm text-outline">Timestamp</th>
                  <th className="px-lg py-md text-left font-label-sm text-label-sm text-outline">Action</th>
                  <th className="px-lg py-md text-left font-label-sm text-label-sm text-outline">Performed By</th>
                  <th className="px-lg py-md text-left font-label-sm text-label-sm text-outline">School / Entity</th>
                  <th className="px-lg py-md text-left font-label-sm text-label-sm text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {auditLog.map((entry, i) => (
                  <tr key={i} className="border-b border-outline/10 last:border-b-0 hover:bg-surface-container transition-all">
                    <td className="px-lg py-md">{entry.time}</td>
                    <td className="px-lg py-md font-semibold">{entry.action}</td>
                    <td className="px-lg py-md">{entry.by}</td>
                    <td className="px-lg py-md">{entry.entity}</td>
                    <td className={`px-lg py-md ${auditStatusTone[entry.status]}`}>{entry.status}</td>
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
