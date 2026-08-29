import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import FormField from '../../components/ui/FormField.jsx';
import DashboardPageShell from '../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../lib/api.js';

const ENDPOINTS = {
  scholarships: '/finance/scholarships',
  allocations: '/finance/scholarships/allocations',
  students: '/academics/students',
  sessions: '/config/sessions',
};

const COVERAGE_OPTIONS = [
  { value: 'percentage', label: 'Percentage of invoice' },
  { value: 'fixed', label: 'Fixed amount' },
];

const EMPTY_SCHOLARSHIP = { name: '', description: '', coverage_type: 'percentage', coverage_value: '' };
const EMPTY_ALLOCATION = { scholarship: '', student: '', session: '', notes: '' };

export default function BursaryScholarships() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const scholarships = data?.scholarships || [];
  const allocations = data?.allocations || [];
  const students = data?.students || [];
  const sessions = data?.sessions || [];

  const [schDrawerOpen, setSchDrawerOpen] = useState(false);
  const [schForm, setSchForm] = useState(EMPTY_SCHOLARSHIP);
  const [schSaving, setSchSaving] = useState(false);
  const [schError, setSchError] = useState('');

  const [allocDrawerOpen, setAllocDrawerOpen] = useState(false);
  const [allocForm, setAllocForm] = useState(EMPTY_ALLOCATION);
  const [allocSaving, setAllocSaving] = useState(false);
  const [allocError, setAllocError] = useState('');
  const [allocMessage, setAllocMessage] = useState('');

  const openNewScholarship = () => {
    setSchForm(EMPTY_SCHOLARSHIP);
    setSchError('');
    setSchDrawerOpen(true);
  };

  const handleSaveScholarship = async () => {
    setSchSaving(true);
    setSchError('');
    try {
      await api.post('/finance/scholarships', schForm);
      setSchDrawerOpen(false);
      reload();
    } catch (err) {
      setSchError(err instanceof ApiError ? err.message : 'Could not create the scholarship.');
    } finally {
      setSchSaving(false);
    }
  };

  const handleDeleteScholarship = async (id) => {
    await api.delete(`/finance/scholarships/${id}`);
    reload();
  };

  const openNewAllocation = () => {
    setAllocForm(EMPTY_ALLOCATION);
    setAllocError('');
    setAllocMessage('');
    setAllocDrawerOpen(true);
  };

  const handleSaveAllocation = async () => {
    setAllocSaving(true);
    setAllocError('');
    try {
      await api.post('/finance/scholarships/allocations', allocForm);
      setAllocMessage('Scholarship allocated — applied as a discount to the student\'s current outstanding invoices.');
      setAllocDrawerOpen(false);
      reload();
    } catch (err) {
      setAllocError(err instanceof ApiError ? err.message : 'Could not allocate the scholarship.');
    } finally {
      setAllocSaving(false);
    }
  };

  const handleRevokeAllocation = async (id) => {
    await api.delete(`/finance/scholarships/allocations/${id}`);
    reload();
  };

  return (
    <DashboardPageShell
      portalId="bursary"
      pageTitle="Scholarships"
      title="Scholarships"
      subtitle="Award types and who's been granted one — allocating discounts every not-yet-settled invoice for that student this session."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={2}
    >
      {data && (
        <div className="space-y-xl">
          {allocMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">{allocMessage}</p>}

          <div>
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Scholarship Catalog</h3>
              <Button variant="primary" size="sm" iconLeft="add" onClick={openNewScholarship}>New Scholarship</Button>
            </div>
            {scholarships.length === 0 ? (
              <Card padding="lg"><EmptyState icon="military_tech" text="No scholarships defined yet." /></Card>
            ) : (
              <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
                {scholarships.map((s) => (
                  <Card key={s.id} padding="lg">
                    <div className="flex items-start justify-between gap-sm">
                      <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">{s.name}</h4>
                      <button type="button" onClick={() => handleDeleteScholarship(s.id)} className="p-1 text-outline hover:text-error transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                    {s.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{s.description}</p>}
                    <p className="font-label-sm text-label-sm text-primary mt-sm">
                      {s.coverage_type === 'percentage' ? `${s.coverage_value}% off` : `₦${Number(s.coverage_value).toLocaleString()} off`}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Allocations</h3>
              <Button variant="primary" size="sm" iconLeft="add" onClick={openNewAllocation} disabled={scholarships.length === 0}>Allocate</Button>
            </div>
            {allocations.length === 0 ? (
              <Card padding="lg"><EmptyState icon="how_to_reg" text="No scholarships have been allocated yet." /></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Scholarship</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Student</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Session</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Awarded</th>
                        <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {allocations.map((a) => (
                        <tr key={a.id}>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{a.scholarship_name}</td>
                          <td className="px-lg py-3 font-body-md text-body-md text-on-surface">{a.student_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{a.session_name}</td>
                          <td className="px-lg py-3 font-label-sm text-label-sm text-on-surface-variant">{new Date(a.awarded_at).toLocaleDateString()}</td>
                          <td className="px-lg py-3 text-right">
                            <button type="button" onClick={() => handleRevokeAllocation(a.id)} title="Revoke" className="p-2 text-outline hover:text-error transition-colors">
                              <span className="material-symbols-outlined text-[20px]">remove_circle</span>
                            </button>
                          </td>
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

      <Drawer
        open={schDrawerOpen}
        onClose={() => setSchDrawerOpen(false)}
        title="New Scholarship"
        footer={<Button variant="primary" onClick={handleSaveScholarship} disabled={schSaving || !schForm.name || !schForm.coverage_value}>{schSaving ? 'Saving…' : 'Create Scholarship'}</Button>}
      >
        <div className="space-y-md">
          {schError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{schError}</p>}
          <FormField field={{ key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Merit Scholarship' }} value={schForm.name} onChange={(v) => setSchForm((p) => ({ ...p, name: v }))} />
          <FormField field={{ key: 'description', label: 'Description', type: 'textarea' }} value={schForm.description} onChange={(v) => setSchForm((p) => ({ ...p, description: v }))} />
          <FormField field={{ key: 'coverage_type', label: 'Coverage Type', type: 'select', required: true, options: COVERAGE_OPTIONS }} value={schForm.coverage_type} onChange={(v) => setSchForm((p) => ({ ...p, coverage_type: v }))} />
          <FormField
            field={{ key: 'coverage_value', label: schForm.coverage_type === 'percentage' ? 'Percentage (0-100)' : 'Fixed Amount', type: 'number', required: true }}
            value={schForm.coverage_value}
            onChange={(v) => setSchForm((p) => ({ ...p, coverage_value: v }))}
          />
        </div>
      </Drawer>

      <Drawer
        open={allocDrawerOpen}
        onClose={() => setAllocDrawerOpen(false)}
        title="Allocate Scholarship"
        footer={<Button variant="primary" onClick={handleSaveAllocation} disabled={allocSaving || !allocForm.scholarship || !allocForm.student || !allocForm.session}>{allocSaving ? 'Allocating…' : 'Allocate'}</Button>}
      >
        <div className="space-y-md">
          {allocError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{allocError}</p>}
          <FormField
            field={{ key: 'scholarship', label: 'Scholarship', type: 'select', required: true, options: scholarships.map((s) => ({ value: s.id, label: s.name })) }}
            value={allocForm.scholarship}
            onChange={(v) => setAllocForm((p) => ({ ...p, scholarship: v }))}
          />
          <FormField
            field={{ key: 'student', label: 'Student', type: 'select', required: true, options: students.map((s) => ({ value: s.id, label: s.full_name })) }}
            value={allocForm.student}
            onChange={(v) => setAllocForm((p) => ({ ...p, student: v }))}
          />
          <FormField
            field={{ key: 'session', label: 'Session', type: 'select', required: true, options: sessions.map((s) => ({ value: s.id, label: s.name })) }}
            value={allocForm.session}
            onChange={(v) => setAllocForm((p) => ({ ...p, session: v }))}
          />
          <FormField field={{ key: 'notes', label: 'Notes', type: 'textarea' }} value={allocForm.notes} onChange={(v) => setAllocForm((p) => ({ ...p, notes: v }))} />
        </div>
      </Drawer>
    </DashboardPageShell>
  );
}
