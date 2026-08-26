import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const COLUMNS = [
  { key: 'name', label: 'Subject' },
  { key: 'code', label: 'Code' },
  { key: 'is_core', label: 'Core', render: (item) => (item.is_core ? 'Yes' : 'No') },
];

const FORM_FIELDS = [
  { key: 'name', label: 'Subject Name', type: 'text', required: true, placeholder: 'e.g. Mathematics' },
  { key: 'code', label: 'Subject Code', type: 'text', required: true, placeholder: 'e.g. MTH' },
  { key: 'is_core', label: 'Core subject (compulsory for all students)', type: 'checkbox' },
];

export default function SuperAdminSubjects() {
  return (
    <AdminCrudPage
      pageTitle="Subjects"
      title="Subjects"
      subtitle="The subjects taught across the school."
      endpoint="/academics/subjects"
      itemLabel="Subject"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ name: '', code: '', is_core: false }}
      emptyIcon="subject"
    />
  );
}
