import AppShell from '../../../components/layout/AppShell.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import ResourceManagerView from './ResourceManagerView.jsx';

export default function TeacherLessonNotes() {
  const { user } = useAuth();
  return (
    <AppShell portalId="teacher" pageTitle="Lesson Notes" user={{ name: user?.full_name || 'Teacher' }}>
      <ResourceManagerView
        title="Lesson Notes"
        subtitle="Upload and manage your lesson notes."
        fixedCategory="Lesson Note"
        emptyIcon="menu_book"
        emptyText="You haven't uploaded any lesson notes yet."
      />
    </AppShell>
  );
}
