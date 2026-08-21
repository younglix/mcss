import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { stats, catalog, statusTone, overdueItems, totalOverdue, recentActivity } from './libraryData.js';

const iconToneClasses = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  success: 'text-secondary',
};

export default function AdminLibraryDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Library Admin" user={{ name: 'Librarian' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Library Catalog"
          subtitle="Track circulation, overdue items, and library activity."
          actions={
            <Button variant="primary" iconLeft="add_circle">
              Issue Book
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg" className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">{stat.label}</p>
                <h3 className="font-headline-lg text-headline-lg text-primary">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconToneClasses[stat.iconTone]}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <Card padding="none" className="lg:col-span-8 overflow-hidden">
            <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-primary">Library Catalog</h2>
              <div className="flex gap-sm">
                <Button variant="secondary" size="sm" iconLeft="filter_list">
                  Filter
                </Button>
                <Button variant="secondary" size="sm" iconLeft="download">
                  Export
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead className="bg-secondary text-on-secondary">
                  <tr>
                    <th className="px-lg py-4 font-label-md text-label-md">Book Title &amp; Author</th>
                    <th className="px-lg py-4 font-label-md text-label-md">ISBN</th>
                    <th className="px-lg py-4 font-label-md text-label-md">Category</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-center">Status</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {catalog.map((book) => (
                    <tr key={book.title} className={`hover:bg-surface-container-low transition-colors ${book.status === 'Overdue' ? 'bg-tertiary-container/5' : ''}`}>
                      <td className="px-lg py-4">
                        <div>
                          <p className="font-headline-md text-body-md text-on-surface leading-tight">{book.title}</p>
                          <p className="text-label-sm font-label-sm text-outline">{book.author}</p>
                        </div>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface-variant">{book.isbn}</td>
                      <td className="px-lg py-4">
                        <Badge tone="secondary">{book.category}</Badge>
                      </td>
                      <td className="px-lg py-4 text-center">
                        <Badge tone={statusTone[book.status]}>{book.status}</Badge>
                      </td>
                      <td className="px-lg py-4 text-right">
                        <button className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <aside className="lg:col-span-4 space-y-lg">
            <Card padding="none" className="overflow-hidden">
              <div className="bg-tertiary-container px-lg py-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-tertiary-container">warning</span>
                <h2 className="font-headline-md text-headline-md text-on-tertiary-container">Overdue Tracker</h2>
              </div>
              <div className="p-lg flex flex-col gap-md">
                {overdueItems.map((item) => (
                  <div
                    key={item.name}
                    className={`p-md rounded-md flex items-start gap-md ${item.urgent ? 'bg-tertiary-container/20 border border-tertiary-container/40' : 'bg-surface-container-low border border-outline/10 opacity-80'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 font-label-md text-label-md">
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-sm">
                        <h4 className="font-body-md text-body-md font-bold text-on-surface">{item.name}</h4>
                        <Badge tone="warning" className="shrink-0">
                          {item.daysLate}
                        </Badge>
                      </div>
                      <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs">{item.book}</p>
                      {item.urgent && (
                        <div className="mt-md flex gap-sm">
                          <Button variant="primary" size="sm">
                            Send Notice
                          </Button>
                          <Button variant="secondary" size="sm">
                            Mark Found
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <a className="text-center font-label-md text-label-md text-tertiary hover:underline pt-xs" href="#">
                  View All {totalOverdue} Overdue Items
                </a>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="bg-surface-container-low px-lg py-md border-b border-outline/10">
                <h2 className="font-headline-md text-headline-md text-primary">Recent Activity</h2>
              </div>
              <div className="p-lg flex flex-col gap-lg">
                {recentActivity.map((item, i) => (
                  <div key={i} className="relative pl-8 border-l-2 border-outline/10 py-1">
                    <div
                      className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-surface-container-lowest border-2 flex items-center justify-center ${
                        item.tone === 'success' ? 'border-secondary' : item.tone === 'secondary' ? 'border-secondary' : 'border-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-label-sm text-primary font-bold">{item.icon}</span>
                    </div>
                    <p className="text-body-md text-on-surface">
                      <strong>{item.title}:</strong> {item.detail}
                    </p>
                    <p className="text-label-sm font-label-sm text-outline">{item.meta}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
