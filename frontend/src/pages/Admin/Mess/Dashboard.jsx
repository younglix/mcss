import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { weekRange, days, mealPlan, diningRotation, inventoryStatus, menuItems } from './messData.js';

export default function AdminMessDashboard() {
  return (
    <AppShell portalId="admin" pageTitle="Mess Admin" user={{ name: 'Admin Office' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Mess & Dining Management"
          subtitle="Administer nutritional plans, schedules, and inventory for academic excellence."
          actions={
            <>
              <Button variant="secondary" iconLeft="print">
                Export Menu
              </Button>
              <Button variant="primary" iconLeft="add">
                Update Plan
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <Card padding="none" className="lg:col-span-8 overflow-hidden">
            <div className="bg-surface-container-low p-md border-b border-outline/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <h3 className="font-label-md text-label-md text-secondary uppercase tracking-widest flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">calendar_month</span> Weekly Meal Plan: {weekRange}
              </h3>
              <div className="flex items-center gap-sm bg-surface-container-lowest rounded-full p-1 border border-outline/10">
                <button className="p-1 hover:bg-surface-container rounded-full transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="font-label-sm text-label-sm text-on-surface px-2">Next Week</span>
                <button className="p-1 hover:bg-surface-container rounded-full transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 border-collapse font-body-md">
                <thead className="bg-primary text-on-primary">
                  <tr>
                    <th className="py-4 px-4 text-left font-label-md border-r border-on-primary/10">Session</th>
                    {days.map((day) => (
                      <th key={day} className="py-4 px-4 text-left font-label-md">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-on-surface-variant divide-y divide-outline/10">
                  {mealPlan.map((row) => (
                    <tr key={row.session} className="hover:bg-surface-container-low transition-colors">
                      <td className="bg-surface-container-low py-4 px-4 font-bold border-r border-outline/10 text-primary">{row.session}</td>
                      {row.meals.map((meal, i) => (
                        <td key={i} className="p-4">
                          <p className="font-semibold text-on-surface">{meal.dish}</p>
                          <span className="text-xs">{meal.sides}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <aside className="lg:col-span-4 space-y-lg">
            <Card padding="lg">
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-label-md text-label-md text-secondary uppercase tracking-widest">Dining Rotation</h3>
                <span className="material-symbols-outlined text-primary">schedule</span>
              </div>
              <div className="space-y-md">
                {diningRotation.map((entry) => (
                  <div
                    key={entry.house}
                    className={`flex items-center justify-between p-md rounded-md ${
                      entry.status === 'Current' ? 'bg-surface-container-low border-l-4 border-tertiary' : 'bg-surface-container-lowest border border-outline/10'
                    }`}
                  >
                    <div>
                      <p className={`font-label-md ${entry.status === 'Current' ? 'text-primary' : 'text-on-surface'}`}>{entry.house}</p>
                      <p className="text-xs text-on-surface-variant">{entry.time}</p>
                    </div>
                    {entry.status && (
                      <div
                        className={
                          entry.status === 'Current'
                            ? 'bg-tertiary-container text-on-tertiary-container text-label-xs px-2 py-1 rounded font-bold uppercase'
                            : 'text-label-xs text-on-surface-variant font-bold uppercase'
                        }
                      >
                        {entry.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className="w-full mt-lg py-2 text-primary font-label-md hover:underline decoration-2 underline-offset-4">
                Adjust Timings
              </button>
            </Card>

            <Card padding="lg" className="bg-secondary text-on-secondary border-none relative overflow-hidden h-48">
              <div className="relative z-10">
                <h3 className="font-headline-md text-[20px] mb-xs">Inventory Status</h3>
                <p className="font-body-md opacity-80 mb-md text-sm">{inventoryStatus.note}</p>
                <div className="space-y-sm">
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-on-secondary h-full" style={{ width: `${inventoryStatus.percent}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-label-md">
                    <span>{inventoryStatus.label}</span>
                    <span>{inventoryStatus.percent}% Sufficient</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10">inventory_2</span>
            </Card>
          </aside>

          <Card padding="lg" className="lg:col-span-12">
            <div className="flex justify-between items-center mb-lg flex-wrap gap-sm">
              <h3 className="font-label-md text-label-md text-secondary uppercase tracking-widest">Active Menu Items &amp; Allergens</h3>
              <div className="flex gap-sm">
                <button className="px-3 py-1 text-xs font-bold border border-outline/20 rounded-full text-on-surface-variant hover:bg-surface-container transition-all">
                  All Categories
                </button>
                <button className="px-3 py-1 text-xs font-bold bg-primary text-on-primary rounded-full">Vegetarian</button>
                <button className="px-3 py-1 text-xs font-bold border border-outline/20 rounded-full text-on-surface-variant">Gluten-Free</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
              {menuItems.map((item) => (
                <div key={item.name} className="group border border-outline/10 rounded-lg p-md hover:border-primary transition-all">
                  <div className="aspect-video w-full rounded-md mb-md overflow-hidden bg-surface-container-high">
                    <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-label-md text-on-surface">{item.name}</h4>
                    <span className="material-symbols-outlined text-primary text-sm">edit</span>
                  </div>
                  <div className="mt-sm flex flex-wrap gap-xs">
                    {item.tags.map((tag) => (
                      <Badge key={tag} tone="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              <button className="border-2 border-dashed border-outline/20 rounded-lg flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all min-h-40">
                <span className="material-symbols-outlined text-[40px] mb-xs">add_circle</span>
                <span className="font-label-md">Add Menu Item</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
