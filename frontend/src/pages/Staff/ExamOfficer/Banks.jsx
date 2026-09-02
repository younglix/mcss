import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import DashboardPageShell from '../../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { banks: '/exam/banks' };

export default function ExamOfficerBanks() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const banks = data?.banks || [];

  const [approving, setApproving] = useState(null);
  const [approveError, setApproveError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);

  const handleApprove = async (bank) => {
    setApproving(bank.id);
    setApproveError('');
    try {
      await api.post(`/exam/banks/${bank.id}/approve`, {});
      reload();
    } catch (err) {
      setApproveError(err instanceof ApiError ? err.message : 'Could not approve this bank.');
    } finally {
      setApproving(null);
    }
  };

  const openView = async (bank) => {
    setViewing(bank);
    setViewDetail(null);
    const result = await api.get(`/exam/banks/${bank.id}`);
    setViewDetail(result);
  };

  return (
    <DashboardPageShell
      portalId="examOfficer"
      pageTitle="Question Banks"
      title="Question Banks"
      subtitle="Every subject's question pool a teacher has submitted — approve once it clears the minimum size."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <div>
          {approveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{approveError}</p>}
          {banks.length === 0 ? (
            <Card padding="lg"><EmptyState icon="quiz" text="No question banks submitted yet." /></Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Subject</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Term</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Questions</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {banks.map((b) => (
                      <tr key={b.id}>
                        <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{b.subject_name}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{b.school_class_name}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{b.term_name}</td>
                        <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{b.question_count}</td>
                        <td className="px-lg py-3">
                          {b.is_approved ? <Badge tone="success">Approved</Badge> : <Badge tone="secondary">Pending</Badge>}
                        </td>
                        <td className="px-lg py-3 text-right whitespace-nowrap">
                          <button type="button" onClick={() => openView(b)} className="font-label-sm text-label-sm text-primary hover:underline mr-md">View</button>
                          {!b.is_approved && (
                            <Button variant="secondary" size="sm" onClick={() => handleApprove(b)} disabled={approving === b.id}>
                              {approving === b.id ? 'Approving…' : 'Approve'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      <Drawer open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.subject_name} — ${viewing.school_class_name}` : ''}>
        {!viewDetail ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading…</p>
        ) : (
          <div className="space-y-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">{viewDetail.questions.length} question(s)</p>
            {viewDetail.questions.map((q, i) => (
              <Card key={q.id} padding="lg">
                <p className="font-body-md text-body-md text-on-surface">{i + 1}. {q.text}</p>
                <div className="mt-sm space-y-xs">
                  {['A', 'B', 'C', 'D'].map((letter) => (
                    <p key={letter} className={`font-label-sm text-label-sm ${q.correct_option === letter ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>
                      {letter}) {q[`option_${letter.toLowerCase()}`]} {q.correct_option === letter && '✓'}
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Drawer>
    </DashboardPageShell>
  );
}
