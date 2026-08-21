import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { totals, categories, items, statusTone, recentActivity, pendingRequests } from './inventoryData.js';

const activityIconTone = {
  primary: 'bg-primary/10 text-primary',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
};

export default function AdminInventoryDashboard() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <AppShell portalId="admin" pageTitle="Inventory Admin" user={{ name: 'School Registrar' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Inventory Module" subtitle="Track school assets, stock levels, and departmental requests." />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          <Card padding="lg" className="md:col-span-8 flex items-center justify-between relative overflow-hidden">
            <div>
              <h3 className="font-label-md text-label-md text-outline uppercase tracking-widest mb-sm">Total Assets Tracked</h3>
              <p className="font-headline-xl text-headline-xl text-primary">{totals.assets}</p>
              <div className="mt-md flex gap-md items-center">
                <span className="flex items-center text-secondary font-bold text-sm">
                  <span className="material-symbols-outlined mr-1 text-body-md">trending_up</span> {totals.deltaText}
                </span>
                <span className="text-on-surface-variant/60 text-sm">{totals.deltaNote}</span>
              </div>
            </div>
            <Button variant="primary" iconLeft="add_circle">
              Add Stock
            </Button>
          </Card>

          <Card padding="lg" className="md:col-span-4 bg-tertiary-container text-on-tertiary-container border-none flex flex-col justify-between">
            <div>
              <h3 className="font-label-md text-label-md opacity-80 uppercase tracking-widest mb-sm">Low Stock Alerts</h3>
              <p className="font-headline-xl text-headline-xl">
                {totals.lowStock} <span className="font-headline-md text-headline-md font-normal">items</span>
              </p>
            </div>
            <Button variant="secondary" className="w-full justify-center border-on-tertiary-container/40 text-on-tertiary-container">
              View Alerts
            </Button>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md bg-surface-container-low p-md rounded-lg border border-outline/10">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="font-label-md text-label-md text-primary">Filter By:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-md py-2 rounded-full font-label-md text-label-md transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline/20 hover:border-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-sm">
            <button className="p-2 border border-outline/20 rounded bg-surface-container-lowest text-on-surface-variant">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 border border-outline/20 rounded bg-surface-container-lowest text-on-surface-variant">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="bg-primary px-lg py-md flex items-center gap-md">
            <h2 className="font-label-md text-label-md text-on-primary">Master Stock Registry</h2>
            <span className="px-2 py-0.5 bg-on-primary/15 text-on-primary text-label-xs font-bold rounded uppercase tracking-tighter">
              Updated 2m ago
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left border-collapse font-body-md">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline/10">
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider">Item ID</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider">Item Name</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider">Category</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider">Quantity</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider">Storage Location</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider">Status</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-primary uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-lg py-4 text-outline font-body-md">{item.id}</td>
                    <td className="px-lg py-4 font-bold text-primary">{item.name}</td>
                    <td className="px-lg py-4">{item.category}</td>
                    <td className={`px-lg py-4 ${item.status !== 'In Stock' ? 'font-bold text-tertiary' : ''}`}>{item.qty}</td>
                    <td className="px-lg py-4">{item.location}</td>
                    <td className="px-lg py-4">
                      <Badge tone={statusTone[item.status]} variant="ribbon">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-lg py-4 text-center">
                      <button className="text-primary hover:text-tertiary transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-surface-container px-lg py-4 flex items-center justify-between border-t border-outline/10">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Showing 1 to 5 of 1,428 entries</p>
            <div className="flex items-center gap-xs">
              <button className="w-8 h-8 flex items-center justify-center border border-outline/20 rounded bg-surface-container-lowest text-outline disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-primary rounded bg-primary text-on-primary text-xs font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center border border-outline/20 rounded bg-surface-container-lowest text-on-surface-variant text-xs hover:border-primary">2</button>
              <button className="w-8 h-8 flex items-center justify-center border border-outline/20 rounded bg-surface-container-lowest text-on-surface-variant text-xs hover:border-primary">3</button>
              <span className="px-2 text-outline">...</span>
              <button className="w-8 h-8 flex items-center justify-center border border-outline/20 rounded bg-surface-container-lowest text-on-surface-variant text-xs hover:border-primary">286</button>
              <button className="w-8 h-8 flex items-center justify-center border border-outline/20 rounded bg-surface-container-lowest text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <Card padding="lg" className="flex flex-col">
            <h3 className="font-label-md text-label-md text-primary mb-lg flex items-center gap-sm">
              <span className="material-symbols-outlined">history</span>
              Recent Logins &amp; Inventory Changes
            </h3>
            <div className="space-y-md flex-1">
              {recentActivity.map((entry, i) => (
                <div key={i} className="flex items-start gap-md pb-md border-b border-outline/10 last:border-b-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activityIconTone[entry.tone]}`}>
                    <span className="material-symbols-outlined text-sm">{entry.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md">{entry.text}</p>
                    <p className="text-label-xs text-outline">{entry.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="bg-surface-container-high flex flex-col justify-between">
            <div>
              <h3 className="font-label-md text-label-md text-primary mb-md">Departmental Requests</h3>
              <p className="text-body-md text-on-surface-variant mb-lg">
                There are {pendingRequests} pending item requests awaiting approval from the Bursar's office.
              </p>
            </div>
            <div className="space-y-sm">
              <Button variant="primary" className="w-full justify-center bg-secondary">
                Review Requests
              </Button>
              <Button variant="secondary" className="w-full justify-center">
                Generate Requisition
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="bg-primary text-on-primary border-none flex flex-col justify-between">
            <span className="material-symbols-outlined text-headline-lg">map</span>
            <div>
              <h3 className="font-label-md text-label-md uppercase tracking-wider mb-1 opacity-80">Storage Management</h3>
              <p className="font-headline-md text-headline-sm">Locate Assets</p>
              <button className="mt-md flex items-center gap-xs font-label-md text-label-sm hover:underline">
                Open Interactive Map <span className="material-symbols-outlined text-body-md">arrow_forward</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
