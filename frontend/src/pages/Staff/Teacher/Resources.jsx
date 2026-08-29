import AppShell from '../../../components/layout/AppShell.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import ResourceManagerView from './ResourceManagerView.jsx';

export default function TeacherResources() {
  const { user } = useAuth();
  return (
    <AppShell portalId="teacher" pageTitle="Resources / E-Learning" user={{ name: user?.full_name || 'Teacher' }}>
      <ResourceManagerView
        title="Resources / E-Learning"
        subtitle="Upload past questions and study materials for your classes."
        emptyIcon="auto_stories"
        emptyText="You haven't uploaded any resources yet."
      />
    </AppShell>
  );
}
