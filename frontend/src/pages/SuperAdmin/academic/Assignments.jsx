import { useMemo } from 'react';
import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'class_arm_label', label: 'Class' },
  { key: 'subject_name', label: 'Subject' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'teacher_name', label: 'Set By' },
];

function buildFields(extra) {
  const classOptions = (extra.classes || []).map((c) => ({ value: c.id, label: `${c.school_class_name} ${c.name}` }));
  const subjectOptions = (extra.subjects || []).map((s) => ({ value: s.id, label: s.name }));
  return [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Algebra Homework' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'class_arm', label: 'Class', type: 'select', required: true, options: classOptions },
    { key: 'subject', label: 'Subject', type: 'select', required: true, options: subjectOptions },
    { key: 'due_date', label: 'Due Date', type: 'date', required: true },
  ];
}

export default function SuperAdminAssignments() {
  const extraEndpoints = useMemo(() => ({ classes: '/academics/classes', subjects: '/academics/subjects' }), []);
  return (
    <AdminCrudPage
      pageTitle="Assignments"
      title="Assignments"
      subtitle="Homework and coursework assigned to classes."
      endpoint="/academics/assignments"
      itemLabel="Assignment"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ title: '', description: '', class_arm: '', subject: '', due_date: '' }}
      emptyIcon="assignment"
    />
  );
}
