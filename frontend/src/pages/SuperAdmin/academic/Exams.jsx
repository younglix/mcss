import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge.jsx';
import AdminCrudPage from '../administration/AdminCrudPage.jsx';
import { api } from '../../../lib/api.js';

const STATUS_TONE = { scheduled: 'secondary', ongoing: 'warning', completed: 'primary', published: 'success' };

const COLUMNS = [
  { key: 'name', label: 'Exam' },
  { key: 'exam_type', label: 'Type', render: (item) => item.exam_type.charAt(0).toUpperCase() + item.exam_type.slice(1) },
  { key: 'start_date', label: 'Start Date' },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <Badge tone={STATUS_TONE[item.status] || 'secondary'}>{item.status}</Badge>,
  },
];

const FORM_FIELDS = [
  { key: 'name', label: 'Exam Name', type: 'text', required: true, placeholder: 'e.g. First Term Examination' },
  {
    key: 'exam_type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      { value: 'test', label: 'Test' },
      { value: 'midterm', label: 'Midterm' },
      { value: 'final', label: 'Final Exam' },
      { value: 'mock', label: 'Mock Exam' },
    ],
  },
  { key: 'start_date', label: 'Start Date', type: 'date', required: true },
  { key: 'end_date', label: 'End Date', type: 'date' },
];

function PublishAction({ item, reload }) {
  const [loading, setLoading] = useState(false);
  if (item.status === 'published') return null;

  const handlePublish = async () => {
    setLoading(true);
    try {
      await api.post(`/academics/exams/${item.id}/publish`, {});
      reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link to={`/super-admin/academic/results?exam=${item.id}`} title="Enter results" className="p-2 text-outline hover:text-primary transition-colors inline-block">
        <span className="material-symbols-outlined text-[20px]">grading</span>
      </Link>
      <button type="button" onClick={handlePublish} disabled={loading} title="Publish results" className="p-2 text-outline hover:text-secondary transition-colors">
        <span className="material-symbols-outlined text-[20px]">campaign</span>
      </button>
    </>
  );
}

export default function SuperAdminExams() {
  return (
    <AdminCrudPage
      pageTitle="Exams"
      title="Exams"
      subtitle="Exams are created for the current session and term."
      endpoint="/academics/exams"
      itemLabel="Exam"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ name: '', exam_type: 'test', start_date: '', end_date: '' }}
      emptyIcon="quiz"
      renderExtraActions={(item, reload) => <PublishAction item={item} reload={reload} />}
    />
  );
}
