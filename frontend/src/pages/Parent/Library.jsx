import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

export default function ParentLibrary() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get('/academics/students/my-children')
      .then((data) => {
        setChildren(data);
        if (data.length > 0) setActiveChildId(data[0].id);
        else setLoading(false);
      })
      .catch((err) => { setError(err.message || 'Could not load children.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    api.get(`/student-services/library/loans/child/${activeChildId}`)
      .then(setLoans)
      .catch((err) => setError(err.message || 'Could not load library loans.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));

  return (
    <AppShell portalId="parent" pageTitle="Library" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Library"
          subtitle="Books each child has borrowed, due dates, and return status."
          actions={children.length > 0 && (
            <ChildSwitcher children={childOptions} activeId={activeChildId} onSelect={setActiveChildId} onAdd={() => {}} />
          )}
        />

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {children.length === 0 && !loading ? (
          <Card padding="lg"><EmptyState icon="family_restroom" text="No children linked to this account yet." /></Card>
        ) : loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : loans.length === 0 ? (
          <Card padding="lg"><EmptyState icon="menu_book" text="No books borrowed yet." /></Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Book</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Borrowed</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Due</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {loans.map((l) => {
                    const overdue = !l.returned_at && l.due_date < today;
                    return (
                      <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{l.book_title}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{l.borrowed_at}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{l.due_date}</td>
                        <td className="px-lg py-4">
                          <Badge tone={l.returned_at ? 'secondary' : overdue ? 'error' : 'success'}>
                            {l.returned_at ? 'Returned' : overdue ? 'Overdue' : 'Borrowed'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
