import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import StatCard from '../../../components/ui/StatCard.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import DashboardPageShell from '../../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { banks: '/exam/banks', exams: '/exam/exams' };
const STATUS_TONE = { draft: 'secondary', active: 'success', ended: 'primary' };

export default function ExamOfficerDashboard() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const banks = data?.banks || [];
  const exams = data?.exams || [];

  const pendingBanks = banks.filter((b) => !b.is_approved);
  const activeExams = exams.filter((e) => e.status === 'active');

  return (
    <DashboardPageShell
      portalId="examOfficer"
      pageTitle="Exam Officer Dashboard"
      title="Exam Officer Dashboard"
      subtitle="Question banks, CBE exams, and what's live right now."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={4}
    >
      {data && (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <StatCard icon="quiz" label="Question Banks" value={banks.length} />
            <StatCard icon="pending_actions" iconTone="error" label="Pending Approval" value={pendingBanks.length} />
            <StatCard icon="laptop_chromebook" label="CBE Exams" value={exams.length} />
            <StatCard icon="monitoring" iconTone="secondary" label="Live Right Now" value={activeExams.length} />
          </div>

          {activeExams.length > 0 && (
            <Card padding="lg" className="bg-secondary-container/20 border border-secondary/20">
              <div className="flex items-center justify-between gap-md flex-wrap">
                <div>
                  <p className="font-label-md text-label-md text-secondary uppercase tracking-wide">Live now</p>
                  <p className="font-body-md text-body-md text-on-surface">{activeExams.map((e) => e.title).join(', ')}</p>
                </div>
                <Link to="/staff/exam-officer/monitor" className="font-label-md text-label-md text-primary hover:underline whitespace-nowrap">Open Monitor →</Link>
              </div>
            </Card>
          )}

          <div>
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Banks Awaiting Approval</h3>
              <Link to="/staff/exam-officer/banks" className="font-label-sm text-label-sm text-primary hover:underline">View All →</Link>
            </div>
            {pendingBanks.length === 0 ? (
              <Card padding="lg"><EmptyState icon="task_alt" text="Nothing waiting on approval." /></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Subject</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Questions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {pendingBanks.map((b) => (
                        <tr key={b.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{b.subject_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{b.school_class_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{b.question_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          <div>
            <h3 className="font-headline-md text-headline-sm text-on-surface mb-sm">Recent CBE Exams</h3>
            {exams.length === 0 ? (
              <Card padding="lg"><EmptyState icon="laptop_chromebook" text="No CBE exams configured yet." /></Card>
            ) : (
              <div className="space-y-sm">
                {exams.slice(0, 5).map((e) => (
                  <Card key={e.id} padding="lg" className="flex items-center justify-between gap-md flex-wrap">
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{e.title}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{e.subject_name} · {e.school_class_name}</p>
                    </div>
                    <Badge tone={STATUS_TONE[e.status] || 'secondary'}>{e.status}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
