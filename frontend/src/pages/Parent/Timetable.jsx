import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import ChildSwitcher from '../../components/parent/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api } from '../../lib/api.js';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABEL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };

export default function ParentTimetable() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [slots, setSlots] = useState([]);
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
    api.get(`/academics/timetable/child/${activeChildId}`)
      .then(setSlots)
      .catch((err) => setError(err.message || 'Could not load the timetable.'))
      .finally(() => setLoading(false));
  }, [activeChildId]);

  const childOptions = children.map((c) => ({ id: c.id, name: c.full_name, avatarUrl: null }));
  const byDay = DAY_ORDER.map((day) => ({
    day,
    entries: slots.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));

  return (
    <AppShell portalId="parent" pageTitle="Timetable" user={{ name: user?.full_name || 'Parent' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="Class Timetable"
          subtitle="Each child's weekly class schedule."
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
        ) : slots.length === 0 ? (
          <Card padding="lg"><EmptyState icon="calendar_today" text="No timetable has been set for this class yet." /></Card>
        ) : (
          <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
            {byDay.map(({ day, entries }) => (
              <Card key={day} padding="lg">
                <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">{DAY_LABEL[day]}</h3>
                {entries.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">No classes scheduled.</p>
                ) : (
                  <div className="space-y-sm">
                    {entries.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-md border-b border-outline/10 last:border-0 pb-sm last:pb-0">
                        <div>
                          <p className="font-body-md text-body-md font-semibold text-on-surface">{s.subject_name}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{s.teacher_name || 'Not yet assigned'}</p>
                        </div>
                        <p className="font-label-sm text-label-sm text-primary whitespace-nowrap">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
