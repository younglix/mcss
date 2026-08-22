import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { auditLogs, loginHistory } from './auditLogData.js';

const tabs = [
  { key: 'logs', label: 'Audit Logs' },
  { key: 'logins', label: 'Login History' },
];

export default function SuperAdminAuditLog() {
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <AppShell portalId="superAdmin" pageTitle="Audit Log" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Audit Log"
          subtitle="Append-only record of sensitive actions and every login attempt across the platform."
        />

        <div className="flex gap-xs border-b border-outline/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-lg py-md font-label-md text-label-md border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'logs' ? (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Actor</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Action</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Target</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">IP Address</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {auditLogs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{entry.actorName}</td>
                      <td className="px-lg py-4">
                        <code className="font-label-sm text-label-sm px-sm py-0.5 rounded bg-surface-container text-primary">{entry.action}</code>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface-variant">
                        {entry.targetType !== '—' ? `${entry.targetType} · ` : ''}
                        {entry.targetId}
                      </td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-outline">{entry.ip}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-outline text-right whitespace-nowrap">{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">User</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Result</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Device</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">IP Address</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {loginHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{entry.user}</td>
                      <td className="px-lg py-4">
                        <Badge tone={entry.successful ? 'success' : 'error'} variant="ribbon">
                          {entry.successful ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface-variant">{entry.device}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-outline">{entry.ip}</td>
                      <td className="px-lg py-4 font-label-sm text-label-sm text-outline text-right whitespace-nowrap">{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
