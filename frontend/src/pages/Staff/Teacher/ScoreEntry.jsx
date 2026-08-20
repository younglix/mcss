import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { term, subjects, classes, activeClass, students, pageMeta } from './scoreEntryData.js';

function ScoreInput({ value, max, onChange }) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value ?? ''}
      placeholder="0"
      onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      className="w-full md:w-16 text-center border border-outline-variant rounded font-body-lg text-body-lg min-h-11 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
    />
  );
}

export default function TeacherScoreEntry() {
  const [scores, setScores] = useState(
    Object.fromEntries(students.map((s) => [s.id, { ca1: s.ca1, ca2: s.ca2, exam: s.exam }])),
  );

  const updateScore = (id, field, value) => {
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const totalFor = (id) => {
    const { ca1, ca2, exam } = scores[id];
    return (ca1 ?? 0) + (ca2 ?? 0) + (exam ?? 0);
  };

  return (
    <AppShell portalId="teacher" pageTitle="Teacher Score Entry" user={{ name: 'Subject Teacher' }}>
      <div className="space-y-lg sm:space-y-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-lg">
          <div>
            <div className="flex flex-wrap items-center gap-sm mb-xs">
              <Badge tone="tertiary" variant="ribbon">
                Exam Period
              </Badge>
              <span className="text-on-surface-variant font-label-md text-label-md">{term}</span>
            </div>
            <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-primary">Score Entry</h1>
            <p className="text-on-surface-variant mt-xs font-body-md text-body-md">
              Entering scores for Senior Secondary 2 ({activeClass}).
            </p>
          </div>
          <div className="grid grid-cols-2 lg:flex gap-md w-full lg:w-auto items-end">
            <div className="col-span-2 md:col-span-1 lg:w-48">
              <label className="block font-label-sm text-label-sm text-outline mb-1 uppercase tracking-tighter">Subject</label>
              <select className="w-full border border-outline-variant rounded font-body-md text-body-md py-2.5 px-3 min-h-11 focus:border-primary outline-none">
                {subjects.map((subject) => (
                  <option key={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 lg:w-32">
              <label className="block font-label-sm text-label-sm text-outline mb-1 uppercase tracking-tighter">Class</label>
              <select className="w-full border border-outline-variant rounded font-body-md text-body-md py-2.5 px-3 min-h-11 focus:border-primary outline-none">
                {classes.map((klass) => (
                  <option key={klass}>{klass}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 lg:w-auto">
              <Button variant="primary" iconLeft="save" className="w-full lg:w-auto">
                Publish Scores
              </Button>
            </div>
          </div>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="bg-primary px-lg py-4 flex justify-between items-center flex-wrap gap-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-primary">list_alt</span>
              <h3 className="font-headline-md text-headline-md text-on-primary">Student Assessment Record</h3>
            </div>
            <div className="hidden md:flex items-center gap-xs text-on-primary/80 font-label-md text-label-md">
              <span className="material-symbols-outlined text-sm">info</span>
              Real-time validation enabled
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left border-collapse">
              <thead className="bg-secondary text-on-secondary">
                <tr>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider border-r border-on-secondary/10">
                    Student ID
                  </th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider border-r border-on-secondary/10">
                    Full Name
                  </th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider border-r border-on-secondary/10 text-center">
                    CA 1 (20)
                  </th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider border-r border-on-secondary/10 text-center">
                    CA 2 (20)
                  </th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider border-r border-on-secondary/10 text-center">
                    Exam (60)
                  </th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-center">Total (100)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const total = totalFor(student.id);
                  return (
                    <tr key={student.id} className="border-b border-outline-variant transition-colors hover:bg-primary/5">
                      <td className="px-lg py-4 font-label-md text-label-md text-secondary">{student.id}</td>
                      <td className="px-lg py-4 font-body-md text-body-md font-medium text-on-surface">{student.name}</td>
                      <td className="px-lg py-4 text-center">
                        <ScoreInput
                          value={scores[student.id].ca1}
                          max={20}
                          onChange={(value) => updateScore(student.id, 'ca1', value)}
                        />
                      </td>
                      <td className="px-lg py-4 text-center">
                        <ScoreInput
                          value={scores[student.id].ca2}
                          max={20}
                          onChange={(value) => updateScore(student.id, 'ca2', value)}
                        />
                      </td>
                      <td className="px-lg py-4 text-center">
                        <ScoreInput
                          value={scores[student.id].exam}
                          max={60}
                          onChange={(value) => updateScore(student.id, 'exam', value)}
                        />
                      </td>
                      <td className="px-lg py-4 text-center">
                        <span className={`font-headline-md text-headline-md ${total >= 50 ? 'text-primary' : 'text-error'}`}>
                          {total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-lg bg-surface-container-low flex flex-col md:flex-row justify-between items-center gap-md">
            <div className="flex gap-md">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Pass (&ge;50)</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-error" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Fail (&lt;50)</span>
              </div>
            </div>
            <div className="text-on-surface-variant font-label-md text-label-sm">
              Page {pageMeta.page} of {pageMeta.totalPages} | Total Students: {pageMeta.totalStudents}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
