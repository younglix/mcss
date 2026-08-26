import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/classes', sessions: '/config/sessions' };
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export default function SuperAdminSchoolFees() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const arms = data?.classes || [];
  const currentSession = (data?.sessions || []).find((s) => s.is_current);

  const [selectedArm, setSelectedArm] = useState('');
  const summaryEndpoint = `/finance/school-fees/summary?class_arm=${selectedArm || NIL_UUID}`;
  const summaryData = useDashboardData(useMemo(() => ({ rows: summaryEndpoint }), [summaryEndpoint]));
  const rows = summaryData.data?.rows || [];

  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');
  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    if (!selectedArm || !currentSession) return;
    setGenerating(true);
    setGenMessage('');
    setGenError('');
    try {
      const armInfo = arms.find((a) => a.id === selectedArm);
      const result = await api.post('/finance/school-fees/generate', {
        school_class: armInfo.school_class, session: currentSession.id,
      });
      setGenMessage(`Generated ${result.count} invoice(s).`);
      summaryData.reload();
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : 'Could not generate invoices.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="School Fees" title="School Fees" subtitle="Per-student fee balances for a class, and bulk invoice generation from Fee Structures." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex items-center gap-sm flex-wrap mb-md">
            <select id="class-picker" value={selectedArm} onChange={(e) => setSelectedArm(e.target.value)} className="mcss-field px-md w-auto">
              <option value="">Select a class…</option>
              {arms.map((arm) => (
                <option key={arm.id} value={arm.id}>{arm.school_class_name} {arm.name}</option>
              ))}
            </select>
            {selectedArm && (
              <Button variant="primary" iconLeft="request_quote" onClick={handleGenerate} disabled={generating || !currentSession}>
                {generating ? 'Generating…' : 'Generate Invoices'}
              </Button>
            )}
          </div>

          {genError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{genError}</p>}
          {genMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm mb-md">{genMessage}</p>}

          {!selectedArm ? (
            <Card padding="lg">
              <EmptyState icon="payments" text="Select a class to view fee balances." />
            </Card>
          ) : rows.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="payments" text="No data available yet" />
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Invoiced</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Paid</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {rows.map((row) => (
                      <tr key={row.student}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.student_name}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.total_invoiced}</td>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{row.total_paid}</td>
                        <td className="px-lg py-3 font-body-md text-body-md font-semibold text-on-surface">{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
