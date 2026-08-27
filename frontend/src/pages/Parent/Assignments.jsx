import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

export default function ParentAssignments() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    api.get(`/academics/assignments/child/${activeChildId}`)
      .then((data) => setAssignments([...data].sort((a, b) => a.due_date.localeCompare(b.due_date))))
      .catch((err) => setError(err.message || 'Could not load assignments.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell portalId="parent" pageTitle="Assignments" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Assignments"
          subtitle="What's due for each child, across every subject."
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
        ) : assignments.length === 0 ? (
          <Card padding="lg"><EmptyState icon="assignment" text="No assignments have been given yet." /></Card>
        ) : (
          <div className="space-y-md">
            {assignments.map((a) => {
              const overdue = a.due_date < today;
              return (
                <Card key={a.id} padding="lg">
                  <div className="flex items-start justify-between gap-md flex-wrap">
                    <div>
                      <p className="font-label-sm text-label-sm text-primary uppercase tracking-wide">{a.subject_name}</p>
                      <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{a.title}</h3>
                      {a.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{a.description}</p>}
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{a.teacher_name || 'Teacher not set'}</p>
                    </div>
                    <Badge tone={overdue ? 'error' : 'secondary'}>Due {a.due_date}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
