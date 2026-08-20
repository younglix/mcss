import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { summaryCards, roles, permissionMatrix, auditLog } from './settingsData.js';

const accessIcon = {
  full: { icon: 'check_circle', tone: 'text-secondary' },
  view: { icon: 'visibility', tone: 'text-tertiary-container' },
  none: { icon: 'radio_button_unchecked', tone: 'text-outline' },
};

const logTone = {
  success: { border: 'border-secondary', text: 'text-secondary' },
  primary: { border: 'border-primary', text: 'text-primary' },
  error: { border: 'border-error', text: 'text-error' },
  secondary: { border: 'border-secondary', text: 'text-secondary' },
  tertiary: { border: 'border-tertiary-container', text: 'text-tertiary-container' },
};

const inputClasses = 'w-full px-md py-2 border border-outline/20 rounded text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all';

export default function SuperAdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <AppShell portalId="superAdmin" pageTitle="Platform Settings" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Platform Settings"
          subtitle="Access control, branding, and platform-wide audit history."
          actions={<Button variant="primary">Save Changes</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {summaryCards.map((card) => (
            <Card key={card.title} padding="lg">
              <div className="flex items-center gap-md mb-md">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${card.iconTone}`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <div>
                  <h3 className={`font-headline-md text-headline-md ${card.tone}`}>{card.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{card.note}</p>
                </div>
              </div>
              {card.progress != null && (
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${card.progress}%` }} />
                </div>
              )}
              {card.swatches && (
                <div className="flex gap-xs">
                  <div className="w-6 h-6 rounded-full bg-primary" />
                  <div className="w-6 h-6 rounded-full bg-secondary" />
                  <div className="w-6 h-6 rounded-full bg-tertiary-container" />
                  <div className="w-6 h-6 rounded-full border border-outline/30" />
                </div>
              )}
              {card.status && (
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Health Status: <span className="text-secondary font-bold">{card.status}</span>
                </p>
              )}
            </Card>
          ))}
        </div>

        <Card padding="none" className="overflow-hidden" id="matrix">
          <div className="bg-surface-container-low px-lg py-md border-b border-outline/10 flex flex-col sm:flex-row justify-between sm:items-center gap-sm">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">Role/Permission Matrix</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Configure cross-module access for primary system roles.</p>
            </div>
            <button className="flex items-center gap-sm text-primary font-label-md text-label-md hover:underline">
              <span className="material-symbols-outlined text-body-md">add_circle</span>
              Create New Role
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left border-collapse">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="p-lg font-label-md text-label-md border-r border-on-primary/10">Module Name</th>
                  {roles.map((role) => (
                    <th key={role} className="p-lg font-label-md text-label-md text-center">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {permissionMatrix.map((row) => (
                  <tr key={row.module} className="border-b border-outline/10 hover:bg-surface-container-low transition-colors">
                    <td className="p-lg font-bold text-on-surface border-r border-outline/10">{row.module}</td>
                    {row.access.map((level, i) => (
                      <td key={i} className="p-lg text-center">
                        <span className={`material-symbols-outlined ${accessIcon[level].tone}`}>{accessIcon[level].icon}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          <section className="lg:col-span-5 space-y-lg" id="branding">
            <Card padding="lg">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">Global Branding</h2>
              <div className="space-y-md">
                <div>
                  <label className="font-label-md text-label-md text-on-surface mb-xs block">Institution Name</label>
                  <input className={inputClasses} type="text" defaultValue="Mount Carmel Secondary" />
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface mb-xs block">Primary Color</label>
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded border border-outline/20 bg-primary shrink-0" />
                      <input className={`${inputClasses} font-label-md`} type="text" defaultValue="#2e004a" />
                    </div>
                  </div>
                  <div>
                    <label className="font-label-md text-label-md text-on-surface mb-xs block">Secondary Color</label>
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded border border-outline/20 bg-secondary shrink-0" />
                      <input className={`${inputClasses} font-label-md`} type="text" defaultValue="#4e599f" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface mb-xs block">Logo Asset</label>
                  <div className="border-2 border-dashed border-outline/20 rounded-lg p-xl flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-primary text-[48px] mb-sm group-hover:scale-110 transition-transform">cloud_upload</span>
                    <p className="font-label-md text-label-md text-on-surface-variant">Click to upload SVG or PNG</p>
                    <p className="text-[10px] text-outline mt-xs uppercase">Max size: 2MB</p>
                  </div>
                </div>
                <div className="pt-md border-t border-outline/10 flex justify-end gap-md">
                  <Button variant="secondary" className="text-on-surface-variant border-outline/20">
                    Reset Defaults
                  </Button>
                  <Button variant="primary" className="bg-secondary">
                    Update Identity
                  </Button>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="bg-primary text-on-primary border-none flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-headline-md text-headline-md mb-xs">Maintenance Mode</h4>
                <p className="font-body-md text-body-md opacity-80 max-w-60">Restrict platform access for all non-admin users during updates.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={maintenanceMode}
                onClick={() => setMaintenanceMode((v) => !v)}
                className={`relative z-10 w-14 h-7 rounded-full transition-colors shrink-0 ${maintenanceMode ? 'bg-tertiary-container' : 'bg-on-primary/20'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 bg-white rounded-full h-6 w-6 transition-transform ${maintenanceMode ? 'translate-x-7' : ''}`}
                />
              </button>
              <span className="material-symbols-outlined absolute -right-8 -bottom-8 text-[160px] opacity-10">construction</span>
            </Card>
          </section>

          <section className="lg:col-span-7" id="audit">
            <Card padding="none" className="h-full flex flex-col">
              <div className="p-lg border-b border-outline/10 flex items-center justify-between bg-surface-container-low">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">System Audit Log</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Live feed of all administrative actions across the platform.</p>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded border border-outline/20 hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-lg space-y-md max-h-150">
                {auditLog.map((entry, i) => (
                  <div key={i} className={`flex gap-md border-l-4 ${logTone[entry.tone].border} pl-md py-xs hover:bg-surface-container-low transition-colors rounded-r`}>
                    <div className="pt-1">
                      <span className={`material-symbols-outlined ${logTone[entry.tone].text}`}>{entry.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-sm mb-xs">
                        <p className="font-body-md text-body-md">
                          {entry.actor && <strong>{entry.actor}</strong>} {entry.action}
                        </p>
                        <span className="font-label-sm text-label-sm text-outline shrink-0">{entry.time}</span>
                      </div>
                      <Badge tone={entry.tagTone}>{entry.tag}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-md bg-surface-container-low border-t border-outline/10 text-center">
                <button className="font-label-md text-label-md text-primary hover:underline">View Full Historical Audit</button>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
