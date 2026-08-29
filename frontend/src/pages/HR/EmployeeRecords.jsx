import UserManagementPage from '../SuperAdmin/administration/UserManagementPage.jsx';

export default function HREmployeeRecords() {
  return (
    <UserManagementPage
      portalId="hr"
      pageTitle="Employee Records"
      title="Employee Records"
      subtitle="Staff directory, profiles, and role assignments."
      userTypeFilter="staff"
      emptyIcon="badge"
    />
  );
}
