import { useMemo, useState } from 'react';
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

const STATUS_TONE = { active: 'success', graduated: 'primary', withdrawn: 'secondary', suspended: 'error' };

const emptyForm = {
  full_name: '', email: '', phone: '', identifier: '', password: '',
  class_arm: '', date_of_birth: '', gender: '', guardian_name: '', guardian_phone: '',
  guardian_email: '', admission_date: '', status: 'active',
};

function buildEditFields(classOptions) {
  return [
  { key: 'class_arm', id: 'edit_class_arm', label: 'Class', type: 'select', options: classOptions },
  { key: 'date_of_birth', id: 'edit_dob', label: 'Date of Birth', type: 'date' },
  {
    key: 'gender', id: 'edit_gender', label: 'Gender', type: 'select',
    options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
  },
  { key: 'guardian_name', id: 'edit_guardian_name', label: 'Guardian Name', type: 'text' },
  { key: 'guardian_phone', id: 'edit_guardian_phone', label: 'Guardian Phone', type: 'text' },
  { key: 'guardian_email', id: 'edit_guardian_email', label: 'Guardian Email', type: 'text' },
  { key: 'admission_date', id: 'edit_admission_date', label: 'Admission Date', type: 'date' },
  {
    key: 'status', id: 'edit_status', label: 'Status', type: 'select',
    options: [
      { value: 'active', label: 'Active' }, { value: 'graduated', label: 'Graduated' },
      { value: 'withdrawn', label: 'Withdrawn' }, { value: 'suspended', label: 'Suspended' },
    ],
  },
  ];
}

export default function SuperAdminStudents() {
  const endpoints = useMemo(() => ({ students: '/academics/students', classes: '/academics/classes' }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [enrollResult, setEnrollResult] = useState(null);

  const students = data?.students || [];
  const classes = data?.classes || [];
  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.school_class_name} ${c.name}` }));

  const openCreate = () => {
    setEditingStudent(null);
    setFormValues(emptyForm);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormValues({
      ...emptyForm,
      class_arm: student.class_arm || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      guardian_email: student.guardian_email || '',
      admission_date: student.admission_date || '',
      status: student.status,
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      const payload = Object.fromEntries(Object.entries(formValues).filter(([, v]) => v !== ''));
      if (editingStudent) {
        delete payload.email;
        delete payload.phone;
        delete payload.identifier;
        delete payload.password;
        await api.patch(`/academics/students/${editingStudent.id}`, payload);
        setDrawerOpen(false);
      } else {
        const enrolledName = formValues.full_name;
        const result = await api.post('/academics/students', payload);
        setDrawerOpen(false);
        if (result.temporary_password) setEnrollResult({ ...result, full_name: enrolledName });
      }
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.errors && typeof err.errors === 'object') {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ __all__: err.message || 'Something went wrong.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/academics/students/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setFormErrors({ __all__: err.message || 'Could not withdraw this student.' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const createFields = [
    { key: 'full_name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', placeholder: 'Optional if phone/identifier is set' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'identifier', label: 'Admission Number', type: 'text' },
    { key: 'password', label: 'Password (leave blank to auto-generate)', type: 'password' },
    { key: 'class_arm', label: 'Class', type: 'select', options: classOptions },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
    { key: 'guardian_name', label: 'Guardian Name', type: 'text' },
    { key: 'guardian_phone', label: 'Guardian Phone', type: 'text' },
    { key: 'guardian_email', label: 'Guardian Email', type: 'text' },
    { key: 'admission_date', label: 'Admission Date', type: 'date' },
  ];

  return (
    <DashboardPageShell pageTitle="Students" title="Students" subtitle="Enrolled students and their class placement." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="person_add" onClick={openCreate}>
              New Student
            </Button>
          </div>

          <Card padding={students.length ? 'none' : 'lg'}>
            {students.length === 0 ? (
              <EmptyState icon="school" text="No data available yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Name</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Login</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Class</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Guardian</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{student.full_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{student.email || student.identifier || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{student.class_arm_label || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{student.guardian_name || '—'}</td>
                        <td className="px-lg py-4">
                          <Badge tone={STATUS_TONE[student.status] || 'secondary'}>{student.status}</Badge>
                        </td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => openEdit(student)} title="Edit" className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(student)} title="Withdraw" className="p-2 text-outline hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingStudent ? 'Edit Student' : 'Enroll Student'}>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {formErrors.__all__ && <p className="font-label-md text-label-md text-error">{formErrors.__all__}</p>}
          {(editingStudent ? buildEditFields(classOptions) : createFields).map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={(v) => setFormValues((prev) => ({ ...prev, [field.key]: v }))}
              error={formErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingStudent ? 'Save Changes' : 'Enroll Student'}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Withdraw Student?"
        message={`This can't be undone. Withdraw ${deleteTarget?.full_name}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {enrollResult && (
        <ConfirmDialog
          open
          title="Student Enrolled"
          message={`Temporary password for ${enrollResult.full_name}: ${enrollResult.temporary_password} — share this with the family securely; it won't be shown again.`}
          confirmLabel="Done"
          danger={false}
          onConfirm={() => setEnrollResult(null)}
          onCancel={() => setEnrollResult(null)}
        />
      )}
    </DashboardPageShell>
  );
}
