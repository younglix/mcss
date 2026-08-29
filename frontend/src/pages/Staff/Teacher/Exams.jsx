import AppShell from '../../../components/layout/AppShell.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import MarksEntryView from './MarksEntryView.jsx';

export default function TeacherExams() {
  const { user } = useAuth();
  return (
    <AppShell portalId="teacher" pageTitle="Exams" user={{ name: user?.full_name || 'Teacher' }}>
      <MarksEntryView title="Exams" subtitle="Enter final exam scores for your classes." examTypeFilter="final" />
    </AppShell>
  );
}
