import UserManagementPage from './UserManagementPage.jsx';

export default function SuperAdminUserManagement() {
  return (
    <UserManagementPage
      pageTitle="User Management"
      title="User Management"
      subtitle="All user accounts across the platform — staff, students, parents, and applicants."
      userTypeFilter={null}
      emptyIcon="group"
    />
  );
}
