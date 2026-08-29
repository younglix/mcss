import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';

const ENDPOINTS = { payslips: '/finance/payslips' };
const STATUS_TONE = { draft: 'secondary', approved: 'success', paid: 'primary' };
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function HRPayslips() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const payslips = data?.payslips || [];

  return (
    <DashboardPageShell
      portalId="hr"
      pageTitle="Payslips"
      title="Payslips"
      subtitle="Every payslip generated, across every payroll run — set up salaries and run a new month from Payroll."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        payslips.length === 0 ? (
          <Card padding="lg"><EmptyState icon="receipt_long" text="No payslips generated yet." /></Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Staff</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Period</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Basic</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Allowances</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Deductions</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Net Pay</th>
                    <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {payslips.map((p) => (
                    <tr key={p.id}>
                      <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{p.staff_name}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{MONTHS[p.month - 1]} {p.year}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{p.basic_salary}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{p.allowances}</td>
                      <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{p.deductions}</td>
                      <td className="px-lg py-3 font-body-md text-body-md font-semibold text-on-surface">{p.net_pay}</td>
                      <td className="px-lg py-3"><Badge tone={STATUS_TONE[p.run_status] || 'secondary'}>{p.run_status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </DashboardPageShell>
  );
}
