import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import { roles, schools, staff, staffStatusTone, totalStaff, rolePermissions } from './staffData.js';

const inputClasses =
  'w-full border border-outline/20 rounded-md px-4 py-2 font-body-md bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

export default function SuperAdminStaff() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AppShell portalId="superAdmin" pageTitle="Staff Management" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Staff Account Management"
          subtitle="Create, scope, and audit staff accounts across every campus."
          actions={
            <Button variant="primary" iconLeft="person_add" onClick={() => setDrawerOpen(true)}>
              Create New Staff
            </Button>
          }
        />

        <div className="flex flex-wrap gap-md">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className={`${inputClasses} pl-10`} placeholder="Search staff by name, ID or email..." type="text" />
          </div>
          <select className={`${inputClasses} sm:w-auto`}>
            {roles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          <select className={`${inputClasses} sm:w-auto`}>
            {schools.map((school) => (
              <option key={school}>{school}</option>
            ))}
          </select>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left border-collapse">
              <thead className="bg-primary text-on-primary">
                <tr>
                  <th className="px-gutter py-md font-label-md uppercase tracking-wider">Staff Member</th>
                  <th className="px-gutter py-md font-label-md uppercase tracking-wider">Staff ID</th>
                  <th className="px-gutter py-md font-label-md uppercase tracking-wider">Role &amp; Access</th>
                  <th className="px-gutter py-md font-label-md uppercase tracking-wider">School / Dept</th>
                  <th className="px-gutter py-md font-label-md uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md font-label-md uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-gutter py-md">
                      <div className="flex items-center gap-md">
                        <Avatar fallbackInitials={member.initials} alt={member.name} />
                        <div>
                          <div className="font-label-md text-on-surface">{member.name}</div>
                          <div className="text-on-surface-variant font-label-sm">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-gutter py-md font-body-md text-on-surface-variant">{member.id}</td>
                    <td className="px-gutter py-md">
                      <span className={`px-3 py-1 rounded-full font-label-sm ${member.tone}`}>{member.role}</span>
                    </td>
                    <td className="px-gutter py-md font-body-md text-on-surface-variant">{member.dept}</td>
                    <td className="px-gutter py-md">
                      <Badge tone={staffStatusTone[member.status]}>{member.status}</Badge>
                    </td>
                    <td className="px-gutter py-md text-right">
                      <div className="flex justify-end gap-sm opacity-40 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="p-1 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined">{member.status === 'Active' ? 'person_off' : 'person'}</span>
                        </button>
                        <button className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-gutter py-md bg-surface-container flex justify-between items-center">
            <p className="font-label-sm text-on-surface-variant">
              Showing {staff.length} of {totalStaff} Staff Members
            </p>
            <div className="flex gap-sm">
              <button className="p-2 rounded-md hover:bg-surface-container-high border border-outline/20">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="p-2 px-4 rounded-md bg-primary text-on-primary font-label-sm">1</button>
              <button className="p-2 px-4 rounded-md hover:bg-surface-container-high font-label-sm">2</button>
              <button className="p-2 px-4 rounded-md hover:bg-surface-container-high font-label-sm">3</button>
              <button className="p-2 rounded-md hover:bg-surface-container-high border border-outline/20">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Staff Member"
        footer={
          <>
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1 justify-center" onClick={() => setDrawerOpen(false)}>
              Save Account
            </Button>
          </>
        }
      >
        <form className="space-y-lg" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-md">
            <h4 className="font-label-md text-primary uppercase tracking-widest border-b border-outline/10 pb-xs">Identity</h4>
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-sm text-on-surface-variant">First Name</label>
                <input className={inputClasses} type="text" />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-on-surface-variant">Last Name</label>
                <input className={inputClasses} type="text" />
              </div>
            </div>
            <div className="space-y-xs">
              <label className="font-label-sm text-on-surface-variant">Email Address</label>
              <input className={inputClasses} type="email" />
            </div>
          </div>

          <div className="space-y-md">
            <h4 className="font-label-md text-primary uppercase tracking-widest border-b border-outline/10 pb-xs">Role &amp; Access</h4>
            <div className="space-y-xs">
              <label className="font-label-sm text-on-surface-variant">Assign Role</label>
              <select className={inputClasses}>
                <option>Select a role...</option>
                <option>Teacher</option>
                <option>Bursary</option>
                <option>Librarian</option>
                <option>School Administrator</option>
                <option>Super Admin</option>
              </select>
            </div>
            <div className="space-y-xs">
              <label className="font-label-sm text-on-surface-variant">Primary Campus</label>
              <select className={inputClasses}>
                {schools.slice(1).map((school) => (
                  <option key={school}>{school}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-md bg-surface-container-low rounded-lg border border-dashed border-outline/30">
            <h5 className="font-label-sm text-primary mb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">visibility</span>
              Role Preview: Teacher
            </h5>
            <ul className="text-xs space-y-1 text-on-surface-variant font-body-md">
              {rolePermissions.map((perm) => (
                <li key={perm.text} className="flex items-center gap-sm">
                  <span className={`material-symbols-outlined text-sm ${perm.allowed ? 'text-secondary' : 'text-error'}`}>
                    {perm.allowed ? 'check_circle' : 'cancel'}
                  </span>
                  {perm.text}
                </li>
              ))}
            </ul>
          </div>
        </form>
      </Drawer>
    </AppShell>
  );
}
