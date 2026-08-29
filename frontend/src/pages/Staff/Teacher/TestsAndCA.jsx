import AppShell from '../../../components/layout/AppShell.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import MarksEntryView from './MarksEntryView.jsx';

export default function TeacherTestsAndCA() {
  const { user } = useAuth();
  return (
    <AppShell portalId="teacher" pageTitle="Tests & CA" user={{ name: user?.full_name || 'Teacher' }}>
      <MarksEntryView title="Tests & CA" subtitle="Enter continuous assessment scores for your classes." examTypeFilter="test" />
    </AppShell>
  );
}
