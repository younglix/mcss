import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import FormField from '../../components/ui/FormField.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = { outstanding: '/finance/outstanding' };

export default function BursaryCommunication() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const debtors = data?.outstanding || [];

  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    setSendMessage('');
    try {
      const payload = { message };
      if (studentId) payload.student = studentId;
      const result = await api.post('/finance/reminders', payload);
      setSendMessage(result.message);
      reload();
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Could not send reminders.');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardPageShell
      portalId="bursary"
      pageTitle="Communication"
      title="Communication"
      subtitle="Send a fee reminder to one debtor, or every guardian/student with an outstanding balance."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-2xl">
            <form onSubmit={handleSend} className="space-y-lg">
              {sendError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{sendError}</p>}
              {sendMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">{sendMessage}</p>}
              <FormField
                field={{
                  key: 'student', label: 'Recipient (leave blank to remind every debtor)', type: 'select',
                  options: debtors.map((d) => ({ value: d.student, label: `${d.student_name} — balance ${Number(d.balance).toLocaleString()}` })),
                }}
                value={studentId}
                onChange={setStudentId}
              />
              <FormField
                field={{ key: 'message', label: 'Message (optional — a default reminder is sent if left blank)', type: 'textarea', rows: 4 }}
                value={message}
                onChange={setMessage}
              />
              <div className="flex justify-end pt-md border-t border-outline/10">
                <Button type="submit" variant="primary" iconLeft="campaign" disabled={sending || debtors.length === 0}>
                  {sending ? 'Sending…' : studentId ? 'Send Reminder' : `Remind All Debtors (${debtors.length})`}
                </Button>
              </div>
            </form>
          </Card>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Current Debtors</h3>
            {debtors.length === 0 ? (
              <Card padding="lg"><EmptyState icon="campaign" text="No outstanding balances to remind anyone about." /></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {debtors.map((d) => (
                        <tr key={d.student}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{d.student_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{d.class_arm_label || '—'}</td>
                          <td className="px-lg py-3 font-body-md text-body-md font-semibold text-error">{Number(d.balance).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
