import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { salaries: '/finance/salaries', runs: '/finance/payroll/runs', staff: '/users/?user_type=staff' };
const STATUS_TONE = { draft: 'secondary', approved: 'success', paid: 'primary' };
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function SalarySection({ staff, salaries, reload }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ staff: '', basic_salary: '', allowances: '0', deductions: '0' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const staffOptions = staff
    .filter((s) => editing || !salaries.some((sal) => sal.staff === s.id))
    .map((s) => ({ value: s.id, label: s.full_name }));

  const openCreate = () => {
    setEditing(null);
    setValues({ staff: '', basic_salary: '', allowances: '0', deductions: '0' });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (salary) => {
    setEditing(salary);
    setValues({ staff: salary.staff, basic_salary: salary.basic_salary, allowances: salary.allowances, deductions: salary.deductions });
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (editing) {
        await api.patch(`/finance/salaries/${editing.id}`, values);
      } else {
        await api.post('/finance/salaries', values);
      }
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-sm">
        <h3 className="font-headline-md text-headline-sm text-on-surface">Staff Salaries</h3>
        <Button variant="ghost" iconLeft="add" onClick={openCreate}>
          Set Salary
        </Button>
      </div>
      {salaries.length === 0 ? (
        <Card padding="lg">
          <EmptyState icon="payments" text="No data available yet" />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-125 text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Staff</th>
                  <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Basic</th>
                  <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Allowances</th>
                  <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant">Deductions</th>
                  <th className="px-lg py-2 font-label-sm text-label-sm uppercase text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {salaries.map((s) => (
                  <tr key={s.id}>
                    <td className="px-lg py-2 font-body-md text-body-md text-on-surface">{s.staff_name}</td>
                    <td className="px-lg py-2 font-body-md text-body-md text-on-surface">{s.basic_salary}</td>
                    <td className="px-lg py-2 font-body-md text-body-md text-on-surface">{s.allowances}</td>
                    <td className="px-lg py-2 font-body-md text-body-md text-on-surface">{s.deductions}</td>
                    <td className="px-lg py-2 text-right">
                      <button type="button" onClick={() => openEdit(s)} className="p-1 text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Salary' : 'Set Salary'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField
            field={{ key: 'staff', id: 'salary_staff', label: 'Staff', type: 'select', required: true, options: staffOptions }}
            value={values.staff}
            onChange={(v) => setValues((prev) => ({ ...prev, staff: v }))}
            error={errors.staff?.[0]}
          />
          <FormField
            field={{ key: 'basic_salary', id: 'salary_basic', label: 'Basic Salary', type: 'number', required: true }}
            value={values.basic_salary}
            onChange={(v) => setValues((prev) => ({ ...prev, basic_salary: v }))}
            error={errors.basic_salary?.[0]}
          />
          <FormField
            field={{ key: 'allowances', id: 'salary_allowances', label: 'Allowances', type: 'number' }}
            value={values.allowances}
            onChange={(v) => setValues((prev) => ({ ...prev, allowances: v }))}
            error={errors.allowances?.[0]}
          />
          <FormField
            field={{ key: 'deductions', id: 'salary_deductions', label: 'Deductions', type: 'number' }}
            value={values.deductions}
            onChange={(v) => setValues((prev) => ({ ...prev, deductions: v }))}
            error={errors.deductions?.[0]}
          />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Set Salary'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function RunsSection({ runs, reload }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [payslipsFor, setPayslipsFor] = useState(null);
  const [busyRunId, setBusyRunId] = useState(null);

  const handleCreateRun = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await api.post('/finance/payroll/runs', { month, year });
      setDrawerOpen(false);
      reload();
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (run) => {
    setBusyRunId(run.id);
    setActionError('');
    try {
      await api.post(`/finance/payroll/runs/${run.id}/generate`, {});
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not generate payslips.');
    } finally {
      setBusyRunId(null);
    }
  };

  const handleApprove = async (run) => {
    setBusyRunId(run.id);
    setActionError('');
    try {
      await api.post(`/finance/payroll/runs/${run.id}/approve`, {});
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not approve this run.');
    } finally {
      setBusyRunId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-sm">
        <h3 className="font-headline-md text-headline-sm text-on-surface">Payroll Runs</h3>
        <Button variant="primary" iconLeft="add" onClick={() => setDrawerOpen(true)}>
          New Run
        </Button>
      </div>
      {actionError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm mb-md">{actionError}</p>}
      {runs.length === 0 ? (
        <Card padding="lg">
          <EmptyState icon="work" text="No data available yet" />
        </Card>
      ) : (
        <div className="space-y-sm">
          {runs.map((run) => (
            <Card key={run.id} padding="lg">
              <div className="flex items-center justify-between flex-wrap gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="font-label-md text-label-md font-bold text-on-surface">{MONTHS[run.month - 1]} {run.year}</span>
                  <Badge tone={STATUS_TONE[run.status] || 'secondary'}>{run.status}</Badge>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{run.payslips.length} payslip(s) · Total {run.total_net_pay}</span>
                </div>
                <div className="flex items-center gap-sm">
                  {run.payslips.length > 0 && (
                    <button type="button" onClick={() => setPayslipsFor(run)} className="font-label-sm text-label-sm text-primary hover:underline">
                      View Payslips
                    </button>
                  )}
                  {run.status === 'draft' && (
                    <>
                      <Button variant="ghost" onClick={() => handleGenerate(run)} disabled={busyRunId === run.id}>
                        {busyRunId === run.id ? 'Working…' : 'Generate Payslips'}
                      </Button>
                      <Button variant="secondary" onClick={() => handleApprove(run)} disabled={busyRunId === run.id || run.payslips.length === 0}>
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Payroll Run">
        <form onSubmit={handleCreateRun} className="space-y-lg">
          {errors.__all__ && <p className="font-label-md text-label-md text-error">{errors.__all__}</p>}
          <FormField
            field={{ key: 'month', id: 'run_month', label: 'Month', type: 'select', required: true, options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) }}
            value={month}
            onChange={setMonth}
            error={errors.month?.[0]}
          />
          <FormField
            field={{ key: 'year', id: 'run_year', label: 'Year', type: 'number', required: true }}
            value={year}
            onChange={setYear}
            error={errors.year?.[0]}
          />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Run'}
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={!!payslipsFor} onClose={() => setPayslipsFor(null)} title={payslipsFor ? `Payslips — ${MONTHS[payslipsFor.month - 1]} ${payslipsFor.year}` : ''}>
        {payslipsFor && (
          <div className="space-y-sm">
            {payslipsFor.payslips.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-outline/10 pb-sm">
                <span className="font-body-md text-body-md text-on-surface">{p.staff_name}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Net: {p.net_pay}</span>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function SuperAdminPayroll() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);

  return (
    <DashboardPageShell pageTitle="Payroll" title="Payroll" subtitle="Staff salaries and monthly payroll runs." loading={loading} error={error} onReload={reload} skeletonCount={2}>
      {data && (
        <div className="space-y-xl">
          <SalarySection staff={data.staff || []} salaries={data.salaries || []} reload={reload} />
          <RunsSection runs={data.runs || []} reload={reload} />
        </div>
      )}
    </DashboardPageShell>
  );
}
