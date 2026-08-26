import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api } from '../../../lib/api.js';

const ENDPOINTS = { classes: '/academics/classes', teachers: '/users/?user_type=staff', subjects: '/academics/subjects' };

function ClassTeacherRow({ arm, teachers, reload }) {
  const [teacherId, setTeacherId] = useState(arm.class_teacher?.id || '');
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!teacherId) return;
    setSaving(true);
    try {
      await api.put(`/academics/classes/${arm.id}/class-teacher`, { teacher: teacherId });
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-sm flex-wrap">
      <span className="font-label-sm text-label-sm text-on-surface-variant">Class Teacher:</span>
      <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
        <option value="">Select…</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>{t.full_name}</option>
        ))}
      </select>
      <Button variant="ghost" onClick={handleAssign} disabled={saving || !teacherId || teacherId === arm.class_teacher?.id}>
        {saving ? 'Saving…' : 'Assign'}
      </Button>
    </div>
  );
}

function SubjectAssignmentPanel({ arm, teachers, subjects, reload }) {
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const assignedSubjectIds = new Set(arm.subject_assignments.map((a) => a.subject));

  const handleAdd = async () => {
    if (!subjectId) return;
    setSaving(true);
    try {
      await api.post(`/academics/classes/${arm.id}/subjects`, { subject: subjectId, teacher: teacherId || null });
      setSubjectId('');
      setTeacherId('');
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    await api.delete(`/academics/classes/subjects/${assignmentId}`);
    reload();
  };

  return (
    <div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Subjects Taught:</p>
      <div className="flex flex-wrap gap-xs mb-sm">
        {arm.subject_assignments.length === 0 ? (
          <span className="font-label-sm text-label-sm text-outline">None yet.</span>
        ) : (
          arm.subject_assignments.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              {a.subject_name}{a.teacher_name ? ` — ${a.teacher_name}` : ''}
              <button type="button" onClick={() => handleRemove(a.id)} className="hover:text-error">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex items-center gap-sm flex-wrap">
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
          <option value="">Add subject…</option>
          {subjects.filter((s) => !assignedSubjectIds.has(s.id)).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="mcss-field px-sm py-1 text-label-sm w-auto">
          <option value="">Teacher (optional)…</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
        <Button variant="ghost" iconLeft="add" onClick={handleAdd} disabled={saving || !subjectId}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default function SuperAdminClasses() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const arms = data?.classes || [];
  const teachers = data?.teachers || [];
  const subjects = data?.subjects || [];

  return (
    <DashboardPageShell
      pageTitle="Classes"
      title="Classes"
      subtitle="This session's subject and class-teacher assignments. Create classes and arms in Administration → Classes & Arms."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        arms.length === 0 ? (
          <Card padding="lg">
            <EmptyState icon="class" text="No data available yet" />
          </Card>
        ) : (
          <div className="space-y-md">
            {arms.map((arm) => (
              <Card key={arm.id} padding="lg" className="space-y-md">
                <div className="flex items-center justify-between flex-wrap gap-sm">
                  <h3 className="font-headline-md text-headline-sm text-on-surface">{arm.school_class_name} {arm.name}</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{arm.student_count} student{arm.student_count === 1 ? '' : 's'}</span>
                </div>
                <ClassTeacherRow arm={arm} teachers={teachers} reload={reload} />
                <SubjectAssignmentPanel arm={arm} teachers={teachers} subjects={subjects} reload={reload} />
              </Card>
            ))}
          </div>
        )
      )}
    </DashboardPageShell>
  );
}
