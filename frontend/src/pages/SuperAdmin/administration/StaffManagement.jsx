import UserManagementPage from './UserManagementPage.jsx';

export default function SuperAdminStaffManagement() {
  return (
    <UserManagementPage
      pageTitle="Staff Management"
      title="Staff Management"
      subtitle="Staff accounts and their assigned roles."
      userTypeFilter="staff"
      emptyIcon="badge"
    />
  );
}
