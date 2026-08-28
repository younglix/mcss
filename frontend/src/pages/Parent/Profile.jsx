import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-tight">{label}</p>
      <p className="font-body-md text-body-md text-on-surface">{value || '—'}</p>
    </div>
  );
}

export default function ParentProfile() {
  const { user } = useAuth();

  return (
    <AppShell portalId="parent" pageTitle="My Profile" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="My Profile" subtitle="Your own account details. For your children's records, see Children's Profiles." />

        <Card padding="lg">
          <div className="flex items-center gap-lg mb-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[32px]">person</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-primary">{user?.full_name}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
            <Field label="Email" value={user?.email} />
            <Field label="Phone" value={user?.phone} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
