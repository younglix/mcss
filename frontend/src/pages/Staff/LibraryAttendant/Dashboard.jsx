import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { circulation, shift, genres, catalog, shortcuts } from './catalogData.js';

const shortcutTone = {
  primary: 'bg-primary/10 text-primary',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
};

export default function LibraryAttendantDashboard() {
  return (
    <AppShell portalId="libraryAttendant" pageTitle="Library Attendant" user={{ name: shift.attendant }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Library Catalog"
          subtitle="Manage collection items, circulation status, and resource categorization."
          actions={
            <>
              <Button variant="secondary" iconLeft="filter_list">
                Filters
              </Button>
              <Button variant="primary" iconLeft="add">
                Add New Book
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          <Card padding="lg" className="md:col-span-8 flex flex-wrap justify-between items-center gap-lg">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">Live Circulation</p>
              <h3 className="font-headline-xl text-headline-xl text-primary">{circulation.total.toLocaleString()}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Total items currently in active collection.</p>
            </div>
            <div className="flex gap-lg">
              <div className="text-center">
                <span className="block font-headline-md text-headline-md text-secondary">{circulation.borrowed}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Borrowed</span>
              </div>
              <div className="text-center">
                <span className="block font-headline-md text-headline-md text-error">{circulation.overdue}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Overdue</span>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="md:col-span-4 bg-secondary text-on-secondary border-none flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-headline-lg">auto_stories</span>
              <span className="bg-on-secondary/20 px-sm py-xs rounded-full font-label-sm text-label-sm">Active Now</span>
            </div>
            <div>
              <h4 className="font-headline-md text-headline-md mb-xs">Attendant Shift</h4>
              <p className="font-body-md text-body-md opacity-80">
                Logged in as: {shift.attendant}
                <br />
                Shift ends in {shift.endsIn}
              </p>
            </div>
          </Card>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="p-lg border-b border-outline/10 bg-surface-container-low flex flex-col md:flex-row items-stretch md:items-center gap-lg">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="mcss-field w-full pl-xl pr-md"
                placeholder="Search by Title, Author, or ISBN..."
                type="text"
              />
            </div>
            <select className="mcss-field mcss-field-compact px-md">
              {genres.map((genre) => (
                <option key={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left border-collapse">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="px-lg py-md font-label-md text-label-md">Resource</th>
                  <th className="px-lg py-md font-label-md text-label-md">Author / ISBN</th>
                  <th className="px-lg py-md font-label-md text-label-md">Genre</th>
                  <th className="px-lg py-md font-label-md text-label-md">Status</th>
                  <th className="px-lg py-md font-label-md text-label-md">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md divide-y divide-outline/10">
                {catalog.map((book) => (
                  <tr key={book.title} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-12 h-16 rounded shadow-sm overflow-hidden shrink-0 bg-surface-container-high">
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="block font-bold text-primary">{book.title}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{book.shelf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md text-on-surface-variant">
                      <span className="block">{book.author}</span>
                      <span className="text-xs font-mono">{book.isbn}</span>
                    </td>
                    <td className="px-lg py-md">
                      <Badge tone="secondary">{book.genre}</Badge>
                    </td>
                    <td className="px-lg py-md">
                      <Badge tone={book.status === 'Available' ? 'success' : 'error'} variant="ribbon">
                        {book.status}
                      </Badge>
                    </td>
                    <td className="px-lg py-md">
                      <button className="text-primary hover:bg-primary/10 p-xs rounded transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="text-primary hover:bg-primary/10 p-xs rounded transition-colors ml-xs">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-lg border-t border-outline/10 bg-surface-container-low flex flex-col sm:flex-row justify-between items-center gap-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Showing 1-10 of {circulation.total.toLocaleString()} entries
            </p>
            <div className="flex gap-xs">
              <button className="px-sm py-xs bg-surface-container-lowest border border-outline rounded hover:bg-surface-container transition-colors min-h-11">
                <span className="material-symbols-outlined text-body-md">chevron_left</span>
              </button>
              <button className="px-md py-xs bg-primary text-on-primary rounded font-label-sm min-h-11">1</button>
              <button className="px-md py-xs bg-surface-container-lowest border border-outline rounded hover:bg-surface-container transition-colors font-label-sm min-h-11">
                2
              </button>
              <button className="px-md py-xs bg-surface-container-lowest border border-outline rounded hover:bg-surface-container transition-colors font-label-sm min-h-11">
                3
              </button>
              <button className="px-sm py-xs bg-surface-container-lowest border border-outline rounded hover:bg-surface-container transition-colors min-h-11">
                <span className="material-symbols-outlined text-body-md">chevron_right</span>
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {shortcuts.map((shortcut) => (
            <Card key={shortcut.title} padding="sm" className="flex gap-md items-center">
              <div className={`p-sm rounded-full ${shortcutTone[shortcut.tone]}`}>
                <span className="material-symbols-outlined">{shortcut.icon}</span>
              </div>
              <div>
                <h5 className="font-label-md text-label-md text-primary">{shortcut.title}</h5>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{shortcut.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
