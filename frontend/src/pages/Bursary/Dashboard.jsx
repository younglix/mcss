import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import {
  collection,
  outstandingBalances,
  efficiencyByArm,
  actionRequired,
  transactions,
  transactionStatusTone,
} from './dashboardData.js';

function LiveDataBadge() {
  return (
    <div className="bg-surface-container-low px-md py-xs rounded-full flex items-center gap-xs">
      <span className="w-2 h-2 rounded-full animate-pulse bg-tertiary" />
      <span className="font-label-sm text-label-sm text-on-surface-variant">Live Financial Data</span>
    </div>
  );
}

export default function BursaryDashboard() {
  return (
    <AppShell portalId="bursary" pageTitle="Bursary Dashboard" user={{ name: 'Admin User' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Bursary Dashboard"
          subtitle={`Financial overview for the ${collection.term}.`}
          actions={<LiveDataBadge />}
        />

        {/* Hero bento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          <Card padding="lg" className="md:col-span-8 flex flex-col md:flex-row items-center gap-xl relative overflow-hidden">
            <div className="flex-1 space-y-md z-10">
              <span className="font-label-md text-label-md text-primary bg-primary/5 px-md py-xs rounded-full inline-block">
                Term Collection Target
              </span>
              <h3 className="font-headline-lg text-headline-lg text-primary">Total Fees Collected</h3>
              <div className="flex items-baseline gap-xs">
                <span className="font-headline-xl text-headline-xl text-primary">{collection.collected}</span>
                <span className="text-on-surface-variant font-label-md text-label-md">/ {collection.target} Target</span>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Currently at <span className="font-bold text-secondary">{collection.percent}%</span> of the collection goal
                for the {collection.term}. We are ahead of the projected timeline by {collection.aheadDays} days.
              </p>
              <div className="flex flex-wrap gap-md pt-md">
                <Button variant="primary" iconLeft="receipt_long">
                  Generate Report
                </Button>
                <Button variant="secondary">View Details</Button>
              </div>
            </div>
            <ProgressRing percent={collection.percent} label={`${collection.percent}%`} sublabel="Achieved" />
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0" />
          </Card>

          <Card padding="lg" className="md:col-span-4 bg-tertiary text-on-tertiary flex flex-col justify-between border-none">
            <div>
              <div className="flex justify-between items-start mb-md">
                <span className="material-symbols-outlined text-headline-lg">account_balance_wallet</span>
                <span className="bg-on-tertiary/15 text-on-tertiary px-md py-xs rounded-full font-label-sm text-label-sm">
                  High Priority
                </span>
              </div>
              <h4 className="font-headline-md text-headline-md">Outstanding Balances</h4>
              <p className="font-headline-xl text-headline-lg mt-sm">{outstandingBalances.total}</p>
            </div>
            <div className="space-y-sm mt-lg">
              {outstandingBalances.breakdown.map((item) => (
                <div key={item.label} className="flex justify-between text-body-md border-b border-on-tertiary/20 pb-xs">
                  <span className="text-on-tertiary/70">{item.label}</span>
                  <span className="font-bold">{item.amount}</span>
                </div>
              ))}
              <p className="text-xs italic text-on-tertiary/60 mt-sm">
                Total {outstandingBalances.studentsRemaining} students remaining
              </p>
            </div>
          </Card>
        </div>

        {/* Efficiency + action / transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className="lg:col-span-4 space-y-lg">
            <Card padding="none">
              <div className="bg-surface-container-high px-lg py-md border-b border-outline/10">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary">Efficiency by Arm</h3>
              </div>
              <div className="p-lg space-y-md">
                {efficiencyByArm.map((arm) => (
                  <div key={arm.label} className="space-y-xs">
                    <div className="flex justify-between font-label-md text-label-md">
                      <span>{arm.label}</span>
                      <span className="text-primary font-bold">{arm.percent}%</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${arm.tone === 'tertiary' ? 'bg-tertiary' : 'bg-primary'}`}
                        style={{ width: `${arm.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg" className="flex items-start gap-md">
              <span className="material-symbols-outlined text-primary text-headline-lg-mobile">info</span>
              <div>
                <h4 className="font-label-md text-label-md text-primary mb-xs">{actionRequired.title}</h4>
                <p className="text-body-md text-on-surface-variant">{actionRequired.message}</p>
                <Button variant="ghost" size="sm" className="mt-sm px-0">
                  {actionRequired.linkText}
                </Button>
              </div>
            </Card>
          </div>

          <Card padding="none" className="lg:col-span-8 overflow-hidden">
            <div className="bg-surface-container-high px-lg py-md border-b border-outline/10 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">Recent Transactions</h3>
              <Button variant="ghost" size="sm" iconRight="chevron_right">
                View All History
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary text-left">
                    <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Reference ID</th>
                    <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Student / Class</th>
                    <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Amount</th>
                    <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="text-body-md font-body-md divide-y divide-outline/10">
                  {transactions.map((tx) => (
                    <tr key={tx.ref} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-md text-on-surface-variant font-mono">{tx.ref}</td>
                      <td className="px-lg py-md">
                        <div className="font-bold text-primary">{tx.student}</div>
                        <div className="text-xs text-on-surface-variant">{tx.class}</div>
                      </td>
                      <td className="px-lg py-md font-bold">{tx.amount}</td>
                      <td className="px-lg py-md">
                        <Badge tone={transactionStatusTone[tx.status]}>{tx.status}</Badge>
                      </td>
                      <td className="px-lg py-md text-on-surface-variant">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
