import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { filters, selectedCount, totalCount, students, pagination, capacity } from './studentDirectoryData.js';

export default function AdminStudentDirectory() {
  return (
    <AppShell portalId="admin" pageTitle="Student Directory" user={{ name: 'Admin User' }}>
      <div className="space-y-lg">
        <PageHeader
          title="Student Directory"
          subtitle="Manage academic records and enrollment for the 2023/2024 Session."
          actions={
            <>
              <Button variant="primary" iconLeft="person_add">
                Add Student
              </Button>
              <Button variant="secondary" iconLeft="upload">
                Import CSV
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <Card padding="sm" className="md:col-span-1">
            <label className="font-label-md text-label-md text-on-surface-variant mb-xs block">Class</label>
            <select className="w-full bg-transparent border-none font-body-md text-body-md focus:ring-0 p-0">
              {filters.classes.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Card>
          <Card padding="sm" className="md:col-span-1">
            <label className="font-label-md text-label-md text-on-surface-variant mb-xs block">Arm/Section</label>
            <select className="w-full bg-transparent border-none font-body-md text-body-md focus:ring-0 p-0">
              {filters.arms.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Card>
          <Card padding="sm" className="md:col-span-1">
            <label className="font-label-md text-label-md text-on-surface-variant mb-xs block">Session</label>
            <select className="w-full bg-transparent border-none font-body-md text-body-md focus:ring-0 p-0">
              {filters.sessions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Card>
          <Button variant="secondary" className="md:col-span-1 justify-center" iconLeft="filter_list">
            Apply Filters
          </Button>
        </div>

        <div className="bg-surface-container p-sm px-lg rounded-full flex flex-wrap items-center justify-between gap-md border border-outline/20">
          <div className="flex items-center gap-md flex-wrap">
            <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-body-md">check_circle</span>
              {selectedCount} Students Selected
            </span>
            <div className="h-4 w-px bg-outline/20" />
            <div className="flex items-center gap-md flex-wrap">
              <button className="text-label-sm text-primary font-bold hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">trending_up</span>Promote Class
              </button>
              <button className="text-label-sm text-primary font-bold hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">badge</span>Generate ID Cards
              </button>
              <button className="text-label-sm text-error font-bold hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">delete</span>Archive Selected
              </button>
            </div>
          </div>
          <span className="text-label-sm text-on-surface-variant italic">Showing 1-10 of {totalCount} students</span>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 border-collapse">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="p-md text-left w-12">
                    <input type="checkbox" />
                  </th>
                  <th className="p-md text-left font-label-md text-label-md font-bold uppercase tracking-wider">Student Name</th>
                  <th className="p-md text-left font-label-md text-label-md font-bold uppercase tracking-wider">ID Number</th>
                  <th className="p-md text-left font-label-md text-label-md font-bold uppercase tracking-wider">Class/Arm</th>
                  <th className="p-md text-left font-label-md text-label-md font-bold uppercase tracking-wider">Status</th>
                  <th className="p-md text-right font-label-md text-label-md font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="p-md">
                      <input type="checkbox" />
                    </td>
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <Avatar src={student.photoUrl} alt={student.name} fallbackInitials={student.initials} />
                        <div>
                          <div className="font-bold text-on-surface">{student.name}</div>
                          <div className="text-xs text-on-surface-variant font-body-md">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-md font-body-md text-on-surface">{student.id}</td>
                    <td className="p-md font-body-md text-on-surface">{student.classArm}</td>
                    <td className="p-md">
                      <Badge tone={student.status === 'Enrolled' ? 'primary' : 'secondary'} variant="ribbon">
                        {student.status}
                      </Badge>
                    </td>
                    <td className="p-md text-right">
                      <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-primary/10 rounded-lg text-primary">
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button className="p-1.5 hover:bg-primary/10 rounded-lg text-primary">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="p-1.5 hover:bg-primary/10 rounded-lg text-primary">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-md flex items-center justify-between border-t border-outline/10 bg-surface-container-lowest">
            <button
              className="p-2 border border-outline/20 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex items-center gap-xs">
              {pagination.pages.map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg font-bold ${
                    page === pagination.current ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-2">...</span>
              <button className="w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-low">{pagination.lastPage}</button>
            </div>
            <button className="p-2 border border-outline/20 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </Card>

        <Card padding="lg" className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-md max-w-96">
          <div className="p-2 bg-tertiary-container rounded-lg text-on-tertiary-container shrink-0">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-sm">
              <span className="text-label-md text-on-surface-variant">Capacity Status</span>
              <span className="font-headline-md text-headline-md text-primary">{capacity.percentFull}% Full</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-xs">
              <div className="bg-primary h-full" style={{ width: `${capacity.percentFull}%` }} />
            </div>
            <p className="mt-sm text-label-sm text-on-surface-variant">
              Total Capacity: {capacity.totalCapacity} Students. {capacity.note}
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
