import AdminCrudPage from './AdminCrudPage.jsx';

const COLUMNS = [{ key: 'name', label: 'Department Name' }];
const FORM_FIELDS = [{ key: 'name', label: 'Department Name', type: 'text', required: true, placeholder: 'e.g. Science' }];

export default function SuperAdminDepartments() {
  return (
    <AdminCrudPage
      pageTitle="Departments"
      title="Departments"
      subtitle="Academic and administrative departments across the school."
      endpoint="/config/departments"
      itemLabel="Department"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ name: '' }}
      emptyIcon="apartment"
    />
  );
}
