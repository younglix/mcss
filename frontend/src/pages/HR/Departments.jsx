import AdminCrudPage from '../SuperAdmin/administration/AdminCrudPage.jsx';

const COLUMNS = [{ key: 'name', label: 'Department Name' }];
const FORM_FIELDS = [{ key: 'name', label: 'Department Name', type: 'text', required: true, placeholder: 'e.g. Science' }];

export default function HRDepartments() {
  return (
    <AdminCrudPage
      portalId="hr"
      pageTitle="Departments"
      title="Departments"
      subtitle="Academic and administrative department structure across the school."
      endpoint="/config/departments"
      itemLabel="Department"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ name: '' }}
      emptyIcon="apartment"
    />
  );
}
