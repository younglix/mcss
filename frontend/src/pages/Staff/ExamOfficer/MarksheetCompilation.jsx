import AppShell from '../../../components/layout/AppShell.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FabButton from '../../../components/ui/FabButton.jsx';
import { context, stats, subjects, students, averageFor, lastSynced } from './marksheetData.js';

export default function ExamOfficerMarksheet() {
  return (
    <AppShell portalId="examOfficer" pageTitle="Exam Officer Marksheet" user={{ name: 'Exam Officer' }}>
      <div className="space-y-lg sm:space-y-xl">
        <div className="flex justify-between items-end flex-wrap gap-lg">
          <div>
            <nav className="text-on-surface-variant font-label-sm text-label-sm mb-xs flex items-center gap-xs">
              <span>{context.academicYear}</span>
              <span className="material-symbols-outlined text-body-md">chevron_right</span>
              <span>{context.term}</span>
            </nav>
            <h1 className="font-headline-lg text-headline-lg text-primary">{context.className} - Marksheet Compilation</h1>
          </div>
          <div className="flex gap-md">
            <Button variant="secondary" iconLeft="print">
              Print Preview
            </Button>
            <Button variant="primary" iconLeft="ios_share">
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <Card padding="lg">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Total Students</p>
            <p className="font-headline-md text-headline-md">{stats.totalStudents}</p>
          </Card>
          <Card padding="lg">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Data Completeness</p>
            <p className="font-headline-md text-headline-md text-error">{stats.dataCompleteness}</p>
          </Card>
          <Card padding="lg" className="relative overflow-hidden">
            <div className="relative z-10">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Missing Scores</p>
              <p className="font-headline-md text-headline-md text-tertiary">{stats.missingScores} Entries</p>
            </div>
            <span className="material-symbols-outlined absolute right-0 bottom-0 text-[64px] opacity-10">warning</span>
          </Card>
          <Card padding="lg">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Class Average</p>
            <p className="font-headline-md text-headline-md">{stats.classAverage}</p>
          </Card>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="bg-surface-container-low p-md border-b border-outline/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-md">
            <div className="flex items-center gap-md">
              <span className="font-label-md text-label-md text-on-surface-variant">Filter by:</span>
              <select className="mcss-field mcss-field-compact px-md">
                <option>All Students</option>
                <option>Missing Data Only</option>
                <option>Borderline Passes</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="mcss-field w-full pl-10 pr-md"
                placeholder="Search by name or admission number..."
                type="text"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left border-collapse font-body-md">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="px-4 py-3 font-label-md text-label-md border-r border-on-primary/20 sticky left-0 bg-primary z-20 w-48">
                    Student Name
                  </th>
                  {subjects.map((subject) => (
                    <th key={subject} className="px-4 py-3 font-label-md text-label-md border-r border-on-primary/20">
                      {subject}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-label-md text-label-md">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {students.map((student) => {
                  const avg = averageFor(student.scores);
                  return (
                    <tr key={student.id} className="hover:bg-surface-container transition-colors">
                      <td className="px-4 py-3 border-r border-outline-variant sticky left-0 bg-surface-container-lowest z-10">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{student.name}</span>
                          <span className="text-label-xs text-on-surface-variant">{student.id}</span>
                        </div>
                      </td>
                      {student.scores.map((score, i) => (
                        <td
                          key={i}
                          className={`px-4 py-3 text-center ${
                            score === null ? 'bg-tertiary-container/10 text-tertiary font-bold italic' : ''
                          }`}
                        >
                          {score === null ? 'Missing' : score}
                        </td>
                      ))}
                      <td className={`px-4 py-3 font-bold text-center ${avg === null ? 'opacity-40' : ''}`}>
                        {avg === null ? 'N/A' : `${avg}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md px-md">
          <div className="flex gap-lg items-center flex-wrap">
            <div className="flex items-center gap-xs">
              <div className="w-4 h-4 bg-tertiary-container/20 border border-tertiary-container" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Incomplete Entry</span>
            </div>
            <div className="flex items-center gap-xs">
              <div className="w-4 h-4 bg-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Confirmed Column</span>
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-outline italic">{lastSynced}</p>
        </div>

        <footer className="pt-lg border-t border-outline/10 flex flex-col sm:flex-row justify-between items-center gap-sm text-on-surface-variant font-label-sm text-label-sm opacity-60">
          <div>© 2024 Mount Carmel Secondary School. Academic Portal v2.4.0</div>
          <div className="flex gap-lg">
            <a className="hover:underline" href="#">
              Contact Support
            </a>
            <a className="hover:underline" href="#">
              Documentation
            </a>
          </div>
        </footer>
      </div>

      <FabButton icon="edit_note" label="Bulk Correct Missing Marks" tone="tertiary" />
    </AppShell>
  );
}
