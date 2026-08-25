import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { sessions: '/config/sessions' };

const SESSION_FIELDS = [
  { key: 'name', id: 'session_name', label: 'Session Name', type: 'text', required: true, placeholder: 'e.g. 2026/2027' },
  { key: 'start_date', id: 'session_start_date', label: 'Start Date', type: 'date', required: true },
  { key: 'end_date', id: 'session_end_date', label: 'End Date', type: 'date', required: true },
];

const TERM_FIELDS = [
  { key: 'name', id: 'term_name', label: 'Term Name', type: 'text', required: true, placeholder: 'e.g. First' },
  { key: 'start_date', id: 'term_start_date', label: 'Start Date', type: 'date', required: true },
  { key: 'end_date', id: 'term_end_date', label: 'End Date', type: 'date', required: true },
];

export default function SuperAdminAcademicSessionTerms() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  const [sessionDrawer, setSessionDrawer] = useState(false);
  const [sessionValues, setSessionValues] = useState({ name: '', start_date: '', end_date: '' });
  const [termDrawer, setTermDrawer] = useState(null); // sessionId or null
  const [termValues, setTermValues] = useState({ name: '', start_date: '', end_date: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'session'|'term', id }
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  const sessions = data?.sessions || [];

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      await api.post('/config/sessions', sessionValues);
      setSessionDrawer(false);
      setSessionValues({ name: '', start_date: '', end_date: '' });
      reload();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      await api.post(`/config/sessions/${termDrawer}/terms`, termValues);
      setTermDrawer(null);
      setTermValues({ name: '', start_date: '', end_date: '' });
      reload();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const setCurrentSession = async (sessionId) => {
    setActionError('');
    try {
      await api.post(`/config/sessions/${sessionId}/set-current`, {});
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not update the current session.');
    }
  };

  const setCurrentTerm = async (termId) => {
    setActionError('');
    try {
      await api.post(`/config/terms/${termId}/set-current`, {});
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not update the current term.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const path = deleteTarget.type === 'session' ? `/config/sessions/${deleteTarget.id}` : `/config/terms/${deleteTarget.id}`;
      await api.delete(path);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not delete.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell
      pageTitle="Academic Session & Terms"
      title="Academic Session & Terms"
      subtitle="Exactly one session and one term are current at any time."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          {actionError && (
            <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">
              {actionError}
            </p>
          )}
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={() => setSessionDrawer(true)}>
              New Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="calendar_month" text="No data available yet" />
            </Card>
          ) : (
            <div className="space-y-lg">
              {sessions.map((session) => (
                <Card key={session.id} padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-sm mb-md">
                    <div className="flex flex-wrap items-center gap-sm">
                      <h3 className="font-headline-md text-headline-sm text-on-surface">{session.name}</h3>
                      {session.is_current && (
                        <Badge tone="success" variant="ribbon">
                          Current Session
                        </Badge>
                      )}
                      <span className="font-label-sm text-label-sm text-outline">
                        {session.start_date} – {session.end_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-sm">
                      {!session.is_current && (
                        <button type="button" onClick={() => setCurrentSession(session.id)} className="font-label-sm text-label-sm text-primary hover:underline">
                          Set as current
                        </button>
                      )}
                      <button type="button" onClick={() => setTermDrawer(session.id)} className="font-label-sm text-label-sm text-primary hover:underline">
                        + Add Term
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ type: 'session', id: session.id })} className="p-1 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {session.terms.length === 0 ? (
                    <p className="font-label-sm text-label-sm text-on-surface-variant">No terms yet for this session.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                      {session.terms.map((term) => (
                        <div key={term.id} className={`p-md rounded-lg border ${term.is_current ? 'border-primary bg-primary/5' : 'border-outline/10'}`}>
                          <div className="flex items-center justify-between mb-xs">
                            <span className="font-label-md text-label-md font-bold text-on-surface">{term.name} Term</span>
                            <div className="flex items-center gap-xs">
                              {term.is_current && <span className="material-symbols-outlined text-primary text-body-md">check_circle</span>}
                              <button type="button" onClick={() => setDeleteTarget({ type: 'term', id: term.id })} className="text-outline hover:text-error transition-colors">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {term.start_date} – {term.end_date}
                          </p>
                          {!term.is_current && (
                            <button type="button" onClick={() => setCurrentTerm(term.id)} className="font-label-sm text-label-sm text-primary hover:underline mt-xs">
                              Set as current
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={sessionDrawer} onClose={() => setSessionDrawer(false)} title="New Academic Session">
        <form onSubmit={handleCreateSession} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {SESSION_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={sessionValues[field.key]}
              onChange={(v) => setSessionValues((prev) => ({ ...prev, [field.key]: v }))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setSessionDrawer(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Session'}
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={!!termDrawer} onClose={() => setTermDrawer(null)} title="New Term">
        <form onSubmit={handleCreateTerm} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {TERM_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={termValues[field.key]}
              onChange={(v) => setTermValues((prev) => ({ ...prev, [field.key]: v }))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setTermDrawer(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Term'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'session' ? 'Session' : 'Term'}?`}
        message="This can't be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
