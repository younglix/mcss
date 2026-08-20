import AppShell from '../../../components/layout/AppShell.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { student, subjects, skills, gradingScale, remarks } from './reportCardData.js';

const bioFields = [
  ['Student Name', student.name],
  ['Academic Session', student.session],
  ['Current Class', student.className],
  ['Term / Phase', student.term],
];

function SkillRating({ rating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-4 h-4 rounded-xs ${i <= rating ? 'bg-primary' : 'border border-outline/40'}`} />
      ))}
    </div>
  );
}

export default function OfficialReportCard() {
  return (
    <AppShell portalId="admin" pageTitle="Official Report Card" user={{ name: 'Admin User' }}>
      <div className="space-y-lg">
        <div className="no-print">
          <PageHeader
            title="Student Report View"
            subtitle="Official academic terminal progress report."
            actions={
              <Button variant="primary" iconLeft="print" onClick={() => window.print()}>
                Print Official Copy
              </Button>
            }
          />
        </div>

        <div className="flex justify-center">
          <div className="report-canvas w-full max-w-250 bg-surface-container-lowest border border-outline/10 shadow-lg p-lg sm:p-xl relative overflow-hidden">
            <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="font-headline-xl text-primary/5 whitespace-nowrap" style={{ fontSize: '120px', transform: 'rotate(-20deg)' }}>
                MOUNT CARMEL
              </span>
            </div>

            <div className="relative">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-lg border-b-2 border-primary pb-lg mb-lg text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-lg">
                  <div className="w-24 h-24 shrink-0 rounded-full bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[48px]">school</span>
                  </div>
                  <div>
                    <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-wider mb-xs">Mount Carmel Secondary School</h1>
                    <p className="font-label-md text-label-md text-on-surface-variant uppercase">Emanating Excellence &amp; Integrity</p>
                    <p className="font-body-md text-on-surface mt-2 italic">Official Academic Terminal Progress Report</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-sm">
                  <div className="w-28 h-36 border border-outline/20 bg-surface-container rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline text-[48px]">person</span>
                  </div>
                  <span className="font-label-sm text-on-surface-variant">STUDENT NO: {student.studentNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl bg-surface-container-low p-md border border-outline/10 rounded">
                {bioFields.map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <p className="font-label-sm text-outline uppercase tracking-tight">{label}</p>
                    <p className="font-body-md font-bold text-primary">{value}</p>
                  </div>
                ))}
                <div className="space-y-1">
                  <p className="font-label-sm text-outline uppercase tracking-tight">Class Position</p>
                  <div className="flex items-center gap-xs">
                    <p className="font-body-md font-bold text-primary">{student.classPosition}</p>
                    <span className="text-on-surface-variant font-label-sm">of {student.classSize} Students</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-label-sm text-outline uppercase tracking-tight">Attendance</p>
                  <p className="font-body-md font-bold text-primary">{student.attendance}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-sm text-outline uppercase tracking-tight">Grade Average</p>
                  <p className="font-body-md font-bold text-primary">{student.average}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-sm text-outline uppercase tracking-tight">Result Status</p>
                  <Badge tone="success" variant="ribbon">
                    {student.status}
                  </Badge>
                </div>
              </div>

              <Card padding="none" className="mb-xl overflow-hidden border-primary">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-on-primary">
                        <th className="p-sm font-label-md border-r border-on-primary/10">Subject Title</th>
                        <th className="p-sm font-label-md text-center border-r border-on-primary/10">CA (40)</th>
                        <th className="p-sm font-label-md text-center border-r border-on-primary/10">Exam (60)</th>
                        <th className="p-sm font-label-md text-center border-r border-on-primary/10">Total (100)</th>
                        <th className="p-sm font-label-md text-center border-r border-on-primary/10">Grade</th>
                        <th className="p-sm font-label-md text-center border-r border-on-primary/10">Avg</th>
                        <th className="p-sm font-label-md">Subject Teacher&apos;s Remark</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md">
                      {subjects.map((subject, i) => (
                        <tr key={subject.name} className={`border-b border-outline/10 ${i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}`}>
                          <td className="p-sm font-bold border-r border-outline/10">{subject.name}</td>
                          <td className="p-sm text-center border-r border-outline/10">{subject.ca}</td>
                          <td className="p-sm text-center border-r border-outline/10">{subject.exam}</td>
                          <td className="p-sm text-center border-r border-outline/10 font-bold">{subject.total}</td>
                          <td className="p-sm text-center border-r border-outline/10 text-secondary font-bold">{subject.grade}</td>
                          <td className="p-sm text-center border-r border-outline/10">{subject.avg}</td>
                          <td className="p-sm text-on-surface-variant text-sm">{subject.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="border border-outline/10 p-md rounded bg-surface-container-low">
                  <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Psychomotor &amp; Affective Skills</h3>
                  <div className="space-y-sm">
                    {skills.map((skill) => (
                      <div key={skill.label} className="flex justify-between items-center text-sm">
                        <span>{skill.label}</span>
                        <SkillRating rating={skill.rating} />
                      </div>
                    ))}
                  </div>
                  <p className="font-label-sm text-outline mt-4 italic">Scale: 5-Excellent, 4-V.Good, 3-Good, 2-Fair, 1-Poor</p>
                </div>
                <div className="border border-outline/10 p-md rounded bg-surface-container-low">
                  <h3 className="font-label-md text-primary uppercase border-b border-outline/10 pb-xs mb-md">Grading Interpretation</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {gradingScale.map(([range, label]) => (
                      <div key={range} className="flex justify-between border-b border-outline/10 py-1">
                        <span>{range}</span> <span className="font-bold">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-xl space-y-lg">
                <div className="border-l-4 border-primary pl-lg py-sm">
                  <p className="font-label-sm text-outline uppercase">Class Teacher&apos;s Remark</p>
                  <p className="font-body-md text-on-surface mt-1 italic">&ldquo;{remarks.classTeacher}&rdquo;</p>
                </div>
                <div className="border-l-4 border-tertiary pl-lg py-sm">
                  <p className="font-label-sm text-outline uppercase">Principal&apos;s Final Comment</p>
                  <p className="font-body-md text-on-surface mt-1 italic">&ldquo;{remarks.principal}&rdquo;</p>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-xl pt-xl">
                  <div className="flex flex-col items-center">
                    <div className="w-48 h-12 border-b-2 border-on-surface-variant mb-2 flex items-end justify-center pb-1">
                      <span className="italic text-on-surface-variant text-sm">B. Augustus</span>
                    </div>
                    <p className="font-label-md uppercase">Class Teacher</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 mb-2 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center text-center">
                      <span className="font-label-sm text-[9px] text-primary uppercase leading-tight px-2">Official
                        Seal</span>
                    </div>
                    <p className="font-label-sm text-outline">School Stamp</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-48 h-12 border-b-2 border-on-surface-variant mb-2 flex items-end justify-center pb-1">
                      <span className="italic text-on-surface-variant text-sm">R. Whitfield</span>
                    </div>
                    <p className="font-label-md uppercase">Principal</p>
                  </div>
                </div>
              </div>

              <footer className="mt-xl border-t border-outline/10 pt-lg flex flex-col md:flex-row justify-between items-center text-outline text-label-sm">
                <span>© 2024 Mount Carmel Secondary School. All Rights Reserved.</span>
                <div className="flex gap-md mt-sm md:mt-0">
                  <span>Campus Safety</span>
                  <span>Contact Us</span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
