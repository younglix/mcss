import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { leaves: '/operations/hr/leave-requests', documents: '/operations/hr/documents', staff: '/users/?user_type=staff' };

const LEAVE_TYPE_OPTIONS = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'compassionate', label: 'Compassionate' },
  { value: 'other', label: 'Other' },
];

const DOCUMENT_CATEGORY_OPTIONS = [
  { value: 'contract', label: 'Contract' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'id', label: 'ID Document' },
  { value: 'other', label: 'Other' },
];

const STATUS_TONE = { pending: 'secondary', approved: 'success', rejected: 'error' };

export default function SuperAdminHR() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const leaves = data?.leaves || [];
  const documents = data?.documents || [];
  const staff = data?.staff || [];
  const staffOptions = staff.map((s) => ({ value: s.id, label: s.full_name }));

  const [leaveDrawer, setLeaveDrawer] = useState(false);
  const [leaveValues, setLeaveValues] = useState({ staff: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const [leaveErrors, setLeaveErrors] = useState({});
  const [savingLeave, setSavingLeave] = useState(false);

  const [docDrawer, setDocDrawer] = useState(false);
  const [docValues, setDocValues] = useState({ staff: '', title: '', file_url: '', category: 'other' });
  const [docErrors, setDocErrors] = useState({});
  const [savingDoc, setSavingDoc] = useState(false);

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    setSavingLeave(true);
    setLeaveErrors({});
    try {
      await api.post('/operations/hr/leave-requests', leaveValues);
      setLeaveDrawer(false);
      setLeaveValues({ staff: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      reload();
    } catch (err) {
      setLeaveErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingLeave(false);
    }
  };

  const handleReview = async (leaveId, status) => {
    await api.post(`/operations/hr/leave-requests/${leaveId}/review`, { status });
    reload();
  };

  const handleCreateDoc = async (e) => {
    e.preventDefault();
    setSavingDoc(true);
    setDocErrors({});
    try {
      await api.post('/operations/hr/documents', docValues);
      setDocDrawer(false);
      setDocValues({ staff: '', title: '', file_url: '', category: 'other' });
      reload();
    } catch (err) {
      setDocErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingDoc(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="HR" title="HR" subtitle="Staff leave requests and HR documents." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div className="space-y-lg">
          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Leave Requests</h2>
            <Button variant="primary" iconLeft="add" onClick={() => setLeaveDrawer(true)}>New Leave Request</Button>
          </div>
          <Card padding={leaves.length ? 'none' : 'lg'}>
            {leaves.length === 0 ? <EmptyState icon="event_busy" text="No data available yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Type</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Dates</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{l.staff_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{l.leave_type}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{l.start_date} – {l.end_date}</td>
                        <td className="px-lg py-4"><Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge></td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          {l.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => handleReview(l.id, 'approved')} className="font-label-sm text-label-sm text-secondary hover:underline mr-md">Approve</button>
                              <button type="button" onClick={() => handleReview(l.id, 'rejected')} className="font-label-sm text-label-sm text-error hover:underline">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Staff Documents</h2>
            <Button variant="primary" iconLeft="add" onClick={() => setDocDrawer(true)}>New Document</Button>
          </div>
          <Card padding={documents.length ? 'none' : 'lg'}>
            {documents.length === 0 ? <EmptyState icon="folder_shared" text="No data available yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead><tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Title</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Category</th>
                  </tr></thead>
                  <tbody className="divide-y divide-outline/10">
                    {documents.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{d.title}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{d.staff_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant capitalize">{d.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <Drawer open={leaveDrawer} onClose={() => setLeaveDrawer(false)} title="New Leave Request">
        <form onSubmit={handleCreateLeave} className="space-y-lg">
          {leaveErrors.__all__ && <p className="font-label-md text-label-md text-error">{leaveErrors.__all__}</p>}
          <FormField field={{ key: 'staff', id: 'leave_staff', label: 'Staff', type: 'select', required: true, options: staffOptions }} value={leaveValues.staff} onChange={(v) => setLeaveValues((p) => ({ ...p, staff: v }))} error={leaveErrors.staff?.[0]} />
          <FormField field={{ key: 'leave_type', id: 'leave_type', label: 'Leave Type', type: 'select', options: LEAVE_TYPE_OPTIONS }} value={leaveValues.leave_type} onChange={(v) => setLeaveValues((p) => ({ ...p, leave_type: v }))} />
          <FormField field={{ key: 'start_date', id: 'leave_start', label: 'Start Date', type: 'date', required: true }} value={leaveValues.start_date} onChange={(v) => setLeaveValues((p) => ({ ...p, start_date: v }))} error={leaveErrors.start_date?.[0]} />
          <FormField field={{ key: 'end_date', id: 'leave_end', label: 'End Date', type: 'date', required: true }} value={leaveValues.end_date} onChange={(v) => setLeaveValues((p) => ({ ...p, end_date: v }))} error={leaveErrors.end_date?.[0]} />
          <FormField field={{ key: 'reason', id: 'leave_reason', label: 'Reason', type: 'textarea' }} value={leaveValues.reason} onChange={(v) => setLeaveValues((p) => ({ ...p, reason: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setLeaveDrawer(false)} disabled={savingLeave}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingLeave}>{savingLeave ? 'Saving…' : 'Submit'}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={docDrawer} onClose={() => setDocDrawer(false)} title="New Staff Document">
        <form onSubmit={handleCreateDoc} className="space-y-lg">
          {docErrors.__all__ && <p className="font-label-md text-label-md text-error">{docErrors.__all__}</p>}
          <FormField field={{ key: 'staff', id: 'doc_staff', label: 'Staff', type: 'select', required: true, options: staffOptions }} value={docValues.staff} onChange={(v) => setDocValues((p) => ({ ...p, staff: v }))} error={docErrors.staff?.[0]} />
          <FormField field={{ key: 'title', id: 'doc_title', label: 'Title', type: 'text', required: true }} value={docValues.title} onChange={(v) => setDocValues((p) => ({ ...p, title: v }))} error={docErrors.title?.[0]} />
          <FormField field={{ key: 'file_url', id: 'doc_file_url', label: 'File URL', type: 'text' }} value={docValues.file_url} onChange={(v) => setDocValues((p) => ({ ...p, file_url: v }))} />
          <FormField field={{ key: 'category', id: 'doc_category', label: 'Category', type: 'select', options: DOCUMENT_CATEGORY_OPTIONS }} value={docValues.category} onChange={(v) => setDocValues((p) => ({ ...p, category: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDocDrawer(false)} disabled={savingDoc}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingDoc}>{savingDoc ? 'Saving…' : 'Upload'}</Button>
          </div>
        </form>
      </Drawer>
    </DashboardPageShell>
  );
}
