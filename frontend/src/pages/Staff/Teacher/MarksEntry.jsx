import AppShell from '../../../components/layout/AppShell.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import MarksEntryView from './MarksEntryView.jsx';

export default function TeacherMarksEntry() {
  const { user } = useAuth();
  return (
    <AppShell portalId="teacher" pageTitle="Marks Entry" user={{ name: user?.full_name || 'Teacher' }}>
      <MarksEntryView title="Marks Entry" subtitle="Enter or submit scores for any exam, class, and subject you teach." />
    </AppShell>
  );
}
