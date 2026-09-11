import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import SuperAdminGeneralSettings from './General.jsx';
import SuperAdminAppearanceSettings from './Appearance.jsx';
import SuperAdminAcademicSettings from './Academic.jsx';
import SuperAdminStudentAdmissionSettings from './StudentAdmission.jsx';
import SuperAdminStaffHRSettings from './StaffHR.jsx';
import SuperAdminFinanceSettings from './Finance.jsx';
import SuperAdminCommunicationSettings from './Communication.jsx';
import SuperAdminUsersSecuritySettings from './UsersSecurity.jsx';
import SuperAdminFormsCustomFields from './FormsCustomFields.jsx';
import SuperAdminDocumentsTemplates from './DocumentsTemplates.jsx';
import SuperAdminWebsiteSettings from './Website.jsx';
import SuperAdminSystemMaintenance from './SystemMaintenance.jsx';
import SuperAdminIntegrations from './Integrations.jsx';

// Every Super Admin setting, one tab, grouped section by section — replaces
// the old 12-way sidebar fan-out (System & Config) that made specific
// switches (admission open/close, profile self-editing, ...) hard to find.
// Each section keeps its own independent data-fetch/save cycle; only the
// active one is mounted at a time.
const SECTIONS = [
  { key: 'general', label: 'General', icon: 'domain', Component: SuperAdminGeneralSettings },
  { key: 'appearance', label: 'Appearance', icon: 'palette', Component: SuperAdminAppearanceSettings },
  { key: 'academic', label: 'Academic', icon: 'grading', Component: SuperAdminAcademicSettings },
  { key: 'student-admission', label: 'Student & Admission', icon: 'school', Component: SuperAdminStudentAdmissionSettings },
  { key: 'staff-hr', label: 'Staff & HR', icon: 'badge', Component: SuperAdminStaffHRSettings },
  { key: 'finance', label: 'Finance', icon: 'payments', Component: SuperAdminFinanceSettings },
  { key: 'communication', label: 'Communication', icon: 'campaign', Component: SuperAdminCommunicationSettings },
  { key: 'users-security', label: 'Users & Security', icon: 'admin_panel_settings', Component: SuperAdminUsersSecuritySettings },
  { key: 'forms', label: 'Forms & Custom Fields', icon: 'dynamic_form', Component: SuperAdminFormsCustomFields },
  { key: 'documents', label: 'Documents & Templates', icon: 'description', Component: SuperAdminDocumentsTemplates },
  { key: 'website', label: 'Website', icon: 'public', Component: SuperAdminWebsiteSettings },
  { key: 'maintenance', label: 'System & Maintenance', icon: 'build', Component: SuperAdminSystemMaintenance },
  { key: 'integrations', label: 'Integrations', icon: 'integration_instructions', Component: SuperAdminIntegrations },
];
const SECTION_KEYS = new Set(SECTIONS.map((s) => s.key));

export default function SuperAdminSettings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get('section');
  const active = requested && SECTION_KEYS.has(requested) ? requested : 'general';
  const activeSection = useMemo(() => SECTIONS.find((s) => s.key === active), [active]);

  const selectSection = (key) => setSearchParams(key === 'general' ? {} : { section: key }, { replace: false });

  return (
    <AppShell portalId="superAdmin" pageTitle="Settings" user={{ name: user?.full_name || 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Settings" subtitle="Everything you can configure for the platform, grouped section by section." />

        <div className="flex flex-col lg:flex-row gap-lg items-start">
          <nav className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-xs overflow-x-auto lg:overflow-visible pb-xs lg:pb-0">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => selectSection(s.key)}
                className={`flex items-center gap-sm px-md py-sm rounded-lg text-left whitespace-nowrap shrink-0 transition-colors ${
                  active === s.key
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                <span className="font-label-md text-label-md">{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0 w-full">
            <h2 className="font-headline-md text-headline-md text-primary mb-lg">{activeSection.label}</h2>
            <activeSection.Component key={activeSection.key} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
