import { useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { settingGroups } from './systemSettingsData.js';

const fieldClasses = 'mcss-field w-full px-md';

function SettingField({ field }) {
  if (field.type === 'toggle') {
    return (
      <label className="flex items-center justify-between gap-md py-xs cursor-pointer">
        <span className="font-label-md text-label-md text-on-surface">{field.label}</span>
        <input type="checkbox" defaultChecked={field.value} className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" />
      </label>
    );
  }
  return (
    <div>
      <label className="font-label-md text-label-md text-on-surface mb-xs block">{field.label}</label>
      <input
        className={fieldClasses}
        type={field.type === 'number' ? 'number' : field.type === 'secret' ? 'password' : 'text'}
        placeholder={field.type === 'secret' ? '••••' : undefined}
        defaultValue={field.type === 'secret' ? '' : field.value}
      />
    </div>
  );
}

export default function SuperAdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <AppShell portalId="superAdmin" pageTitle="System Settings" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="System Settings"
          subtitle="Integrations and platform behavior — SMS, email, payment gateways, and document numbering formats."
          actions={<Button variant="primary">Save Changes</Button>}
        />

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {settingGroups.map((group) => (
            <Card key={group.group} padding="lg">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-primary">{group.icon}</span>
                <h2 className="font-headline-md text-headline-md text-primary">{group.label}</h2>
              </div>
              <div className="space-y-md">
                {group.fields.map((field) => (
                  <SettingField key={field.key} field={field} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
