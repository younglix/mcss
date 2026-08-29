import { useMemo } from 'react';
import Badge from '../../components/ui/Badge.jsx';
import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const SEVERITY_TONE = { minor: 'secondary', moderate: 'warning', severe: 'error' };

const COLUMNS = [
  { key: 'student_name', label: 'Student' },
  { key: 'class_arm_label', label: 'Class', render: (item) => item.class_arm_label || '—' },
  { key: 'incident_date', label: 'Date' },
  { key: 'category', label: 'Category', render: (item) => item.category || '—' },
  { key: 'severity', label: 'Severity', render: (item) => <Badge tone={SEVERITY_TONE[item.severity] || 'secondary'}>{item.severity}</Badge> },
];

function buildFields(extra) {
  const studentOptions = (extra.students || []).map((s) => ({ value: s.id, label: s.full_name }));
  return [
    { key: 'student', label: 'Student', type: 'select', required: true, options: studentOptions },
    { key: 'incident_date', label: 'Incident Date', type: 'date', required: true },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Fighting, Truancy, Bullying' },
    { key: 'severity', label: 'Severity', type: 'select', required: true, options: [
      { value: 'minor', label: 'Minor' }, { value: 'moderate', label: 'Moderate' }, { value: 'severe', label: 'Severe' },
    ] },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'action_taken', label: 'Action Taken', type: 'textarea' },
  ];
}

export default function PrincipalDiscipline() {
  const extraEndpoints = useMemo(() => ({ students: '/academics/students' }), []);
  return (
    <AdminCrudPage
      portalId="principal"
      pageTitle="Discipline"
      title="Discipline"
      subtitle="Student conduct incidents, school-wide."
      endpoint="/student-services/discipline"
      itemLabel="Discipline Record"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ student: '', incident_date: '', category: '', severity: 'minor', description: '', action_taken: '' }}
      emptyIcon="gavel"
    />
  );
}
