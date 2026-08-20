import AppShell from '../../../components/layout/AppShell.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import FabButton from '../../../components/ui/FabButton.jsx';
import { classInfo, reportCardStatus, attendanceHeatmap, attendanceSummary, students } from './classOverviewData.js';

export default function ClassTeacherOverview() {
  const commentsPct = Math.round((reportCardStatus.commentsCompleted / reportCardStatus.total) * 100);
  const verifiedPct = Math.round((reportCardStatus.subjectEntryVerified / reportCardStatus.total) * 100);

  return (
    <AppShell portalId="classTeacher" pageTitle="Class Teacher Overview" user={{ name: classInfo.formMaster }}>
      <div className="space-y-lg sm:space-y-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <Card padding="lg" className="lg:col-span-2 flex flex-col md:flex-row gap-lg">
            <div className="shrink-0 w-full md:w-48 h-48 rounded overflow-hidden relative border border-outline/10">
              <img src={classInfo.photoUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-0">
                <Badge tone="primary" variant="ribbon">
                  Current Class
                </Badge>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-1">{classInfo.academicYear}</p>
                <h2 className="font-headline-lg text-headline-lg text-primary">{classInfo.className}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-sm leading-relaxed">
                  Form Master: <span className="font-bold text-primary">{classInfo.formMaster}</span>
                  <br />
                  Total Students: {classInfo.totalStudents} | Male: {classInfo.male} | Female: {classInfo.female}
                </p>
              </div>
              <div className="flex flex-wrap gap-md mt-lg">
                <Button variant="primary" iconLeft="group">
                  View Class List
                </Button>
                <Button variant="secondary">Send Memo</Button>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex justify-between items-start mb-lg">
              <h3 className="font-label-md text-label-md text-primary uppercase">Report Card Status</h3>
              <Badge tone="tertiary">Term 2</Badge>
            </div>
            <div className="space-y-lg">
              <div>
                <div className="flex justify-between text-label-sm mb-xs">
                  <span>Comments Completed</span>
                  <span className="font-bold">
                    {reportCardStatus.commentsCompleted} / {reportCardStatus.total}
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${commentsPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-label-sm mb-xs">
                  <span>Subject Entry Verified</span>
                  <span className="font-bold">
                    {reportCardStatus.subjectEntryVerified} / {reportCardStatus.total}
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: `${verifiedPct}%` }} />
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-center bg-surface-container-high">
                Enter Form Master Remarks
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-lg">
          <Card padding="lg" className="xl:col-span-1">
            <div className="flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h3 className="font-label-md text-label-md text-primary uppercase">Class Attendance Today</h3>
            </div>
            <div className="grid grid-cols-5 gap-sm mb-lg">
              {attendanceHeatmap.map((status, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-sm transition-colors ${
                    status === 'absent' ? 'bg-error/40 hover:bg-error' : 'bg-primary/20 hover:bg-primary'
                  }`}
                />
              ))}
            </div>
            <div className="space-y-sm">
              <div className="flex justify-between text-label-sm border-b border-outline/10 pb-xs">
                <span className="text-on-surface-variant">Present</span>
                <span className="font-bold text-primary">{attendanceSummary.present}</span>
              </div>
              <div className="flex justify-between text-label-sm border-b border-outline/10 pb-xs">
                <span className="text-on-surface-variant">Absent</span>
                <span className="font-bold text-error">{attendanceSummary.absent}</span>
              </div>
              <div className="flex justify-between text-label-sm">
                <span className="text-on-surface-variant">Lateness</span>
                <span className="font-bold text-secondary">{attendanceSummary.lateness}</span>
              </div>
            </div>
            <Button variant="secondary" className="w-full justify-center mt-lg">
              Take Roll Call
            </Button>
          </Card>

          <div className="xl:col-span-3 space-y-lg">
            <h3 className="font-label-md text-label-md text-primary uppercase">Quick Student Profiles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {students.map((student) => (
                <Card
                  key={student.id}
                  padding="sm"
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    student.alert ? 'border-l-4 border-l-error' : ''
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-surface-container-low border border-outline/10">
                      <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-md text-label-md text-primary truncate">{student.name}</h4>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{student.id}</p>
                      <div className="flex gap-xs mt-1 flex-wrap">
                        {student.tags.map((tag) => (
                          <Badge key={tag} tone={tag === 'Alert' ? 'error' : 'secondary'}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <button
                type="button"
                className="bg-surface-container-low rounded-lg border-2 border-dashed border-outline/30 p-4 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined text-headline-lg">add_circle</span>
                <span className="font-label-sm text-label-sm mt-sm">Add New Student</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <FabButton icon="edit_note" label="Quick class actions" />
    </AppShell>
  );
}
