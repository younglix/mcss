import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../../components/layout/AppShell.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { EmptyState } from '../../SuperAdmin/dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';
import { downloadCsv } from '../../../lib/csv.js';

const PICKER_ENDPOINTS = { exams: '/academics/exams', classes: '/config/classes' };

export default function ExamOfficerMarksheet() {
  const { user } = useAuth();
  const { data: pickerData, loading: pickersLoading } = useDashboardData(PICKER_ENDPOINTS);
  const exams = pickerData?.exams || [];
  const armOptions = useMemo(
    () => (pickerData?.classes || []).flatMap((c) => (c.arms || []).map((a) => ({ id: a.id, label: `${c.name} ${a.name}` }))),
    [pickerData],
  );

  const [examId, setExamId] = useState('');
  const [classArmId, setClassArmId] = useState('');
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    if (!examId || !classArmId) return;
    setLoading(true);
    setError('');
    api.get(`/academics/exams/${examId}/marksheet-compilation?class_arm=${classArmId}`)
      .then(setSheet)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load the marksheet.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSheet(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, classArmId]);

  const visibleStudents = useMemo(() => {
    if (!sheet) return [];
    let rows = sheet.students;
    if (filter === 'missing') rows = rows.filter((s) => s.scores.some((c) => c === null));
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((s) => s.name.toLowerCase().includes(q) || s.identifier.toLowerCase().includes(q));
    return rows;
  }, [sheet, filter, search]);

  const handleExportCsv = () => {
    if (!sheet) return;
    const header = ['Student Name', 'Student ID', ...sheet.subjects.map((s) => s.name), 'Average (%)'];
    const rows = visibleStudents.map((s) => {
      const bySubject = Object.fromEntries(s.scores.filter(Boolean).map((c) => [c.subject, c.percentage]));
      return [
        s.name, s.identifier,
        ...sheet.subjects.map((subj) => (bySubject[subj.id] !== undefined ? bySubject[subj.id] : 'Missing')),
        s.average === null ? 'N/A' : s.average,
      ];
    });
    downloadCsv(`marksheet-${sheet.exam.name}-${sheet.class_arm.label}.csv`.replace(/\s+/g, '-'), [header, ...rows]);
  };

  const stats = sheet?.stats;

  return (
    <AppShell portalId="examOfficer" pageTitle="Exam Officer Marksheet" user={{ name: user?.full_name || 'Exam Officer' }}>
      <div className="space-y-lg sm:space-y-xl">
        <div className="no-print flex justify-between items-end flex-wrap gap-lg">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Marksheet Compilation</h1>
            <p className="font-body-md text-on-surface-variant mt-1">Every student's scores across every subject for one exam, in one class.</p>
          </div>
          <div className="flex gap-md">
            <Button variant="secondary" iconLeft="print" onClick={() => window.print()} disabled={!sheet}>
              Print Preview
            </Button>
            <Button variant="primary" iconLeft="ios_share" onClick={handleExportCsv} disabled={!sheet}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="no-print flex items-center gap-md flex-wrap">
          <select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={pickersLoading} className="mcss-field px-md w-auto">
            <option value="">Select an exam…</option>
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
          <select value={classArmId} onChange={(e) => setClassArmId(e.target.value)} disabled={pickersLoading} className="mcss-field px-md w-auto">
            <option value="">Select a class…</option>
            {armOptions.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        {error && (
          <Card padding="lg" className="border border-error/30 bg-error-container/10">
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          </Card>
        )}

        {!examId || !classArmId ? (
          <Card padding="lg"><EmptyState icon="grading" text="Select an exam and a class to compile its marksheet." /></Card>
        ) : loading ? (
          <Card padding="lg"><EmptyState icon="hourglass_empty" text="Loading…" /></Card>
        ) : sheet && (
          <>
            <nav className="text-on-surface-variant font-label-sm text-label-sm -mt-sm flex items-center gap-xs">
              <span>{sheet.exam.name}</span>
              <span className="material-symbols-outlined text-body-md">chevron_right</span>
              <span>{sheet.class_arm.label}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Total Students</p>
                <p className="font-headline-md text-headline-md">{stats.total_students}</p>
              </Card>
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Data Completeness</p>
                <p className="font-headline-md text-headline-md text-error">{stats.data_completeness}%</p>
              </Card>
              <Card padding="lg" className="relative overflow-hidden">
                <div className="relative z-10">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Missing Scores</p>
                  <p className="font-headline-md text-headline-md text-tertiary">{stats.missing_scores} Entries</p>
                </div>
                <span className="material-symbols-outlined absolute right-0 bottom-0 text-[64px] opacity-10">warning</span>
              </Card>
              <Card padding="lg">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-xs">Class Average</p>
                <p className="font-headline-md text-headline-md">{stats.class_average === null ? '—' : `${stats.class_average}%`}</p>
              </Card>
            </div>

            {sheet.subjects.length === 0 ? (
              <Card padding="lg"><EmptyState icon="grading" text="No subjects are assigned to this class yet." /></Card>
            ) : sheet.students.length === 0 ? (
              <Card padding="lg"><EmptyState icon="grading" text="No students are enrolled in this class yet." /></Card>
            ) : (
              <Card padding="none" className="overflow-hidden">
                <div className="no-print bg-surface-container-low p-md border-b border-outline/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-md">
                  <div className="flex items-center gap-md">
                    <span className="font-label-md text-label-md text-on-surface-variant">Filter by:</span>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mcss-field mcss-field-compact px-md">
                      <option value="all">All Students</option>
                      <option value="missing">Missing Data Only</option>
                    </select>
                  </div>
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                    <input
                      className="mcss-field w-full pl-10 pr-md"
                      placeholder="Search by name or admission number..."
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {visibleStudents.length === 0 ? (
                  <div className="p-lg"><EmptyState icon="search_off" text="No students match this filter/search." /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-200 text-left border-collapse font-body-md">
                      <thead>
                        <tr className="bg-primary text-on-primary">
                          <th className="px-4 py-3 font-label-md text-label-md border-r border-on-primary/20 sticky left-0 bg-primary z-20 w-48">
                            Student Name
                          </th>
                          {sheet.subjects.map((subject) => (
                            <th key={subject.id} className="px-4 py-3 font-label-md text-label-md border-r border-on-primary/20">
                              {subject.name}
                            </th>
                          ))}
                          <th className="px-4 py-3 font-label-md text-label-md">Average</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {visibleStudents.map((student) => {
                          const bySubject = Object.fromEntries(student.scores.filter(Boolean).map((c) => [c.subject, c]));
                          return (
                            <tr key={student.id} className="hover:bg-surface-container transition-colors">
                              <td className="px-4 py-3 border-r border-outline-variant sticky left-0 bg-surface-container-lowest z-10">
                                <div className="flex flex-col">
                                  <span className="font-bold text-primary">{student.name}</span>
                                  <span className="text-label-xs text-on-surface-variant">{student.identifier}</span>
                                </div>
                              </td>
                              {sheet.subjects.map((subject) => {
                                const cell = bySubject[subject.id];
                                return (
                                  <td
                                    key={subject.id}
                                    className={`px-4 py-3 text-center ${cell ? '' : 'bg-tertiary-container/10 text-tertiary font-bold italic'}`}
                                  >
                                    {cell ? `${cell.score}/${cell.max_score}` : 'Missing'}
                                  </td>
                                );
                              })}
                              <td className={`px-4 py-3 font-bold text-center ${student.average === null ? 'opacity-40' : ''}`}>
                                {student.average === null ? 'N/A' : `${student.average}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md px-md">
              <div className="flex gap-lg items-center flex-wrap">
                <div className="flex items-center gap-xs">
                  <div className="w-4 h-4 bg-tertiary-container/20 border border-tertiary-container" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Incomplete Entry</span>
                </div>
              </div>
              <p className="font-label-sm text-label-sm text-outline italic">
                Showing {visibleStudents.length} of {sheet.students.length} student(s)
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
