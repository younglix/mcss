import { useMemo } from 'react';
import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'class_arm_label', label: 'Class', render: (item) => item.class_arm_label || 'All classes' },
  { key: 'uploaded_by_name', label: 'Uploaded By' },
];

function buildFields(extra) {
  const classOptions = (extra.classes || []).map((c) => ({ value: c.id, label: `${c.school_class_name} ${c.name}` }));
  return [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'file_url', label: 'Link / File URL', type: 'text', placeholder: 'https://…' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'class_arm', label: 'Class (leave blank for all classes)', type: 'select', options: classOptions },
  ];
}

export default function SuperAdminResources() {
  const extraEndpoints = useMemo(() => ({ classes: '/academics/classes' }), []);
  return (
    <AdminCrudPage
      pageTitle="Student Resources"
      title="Student Resources"
      subtitle="Documents and links shared with students, optionally scoped to a class."
      endpoint="/student-services/resources"
      itemLabel="Resource"
      extraEndpoints={extraEndpoints}
      columns={COLUMNS}
      formFields={buildFields}
      initialFormValues={{ title: '', description: '', file_url: '', category: '', class_arm: '' }}
      emptyIcon="folder_shared"
    />
  );
}
