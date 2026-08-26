import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api } from '../../../lib/api.js';

const RECORD_FIELDS = [
  { key: 'blood_group', id: 'blood_group', label: 'Blood Group', type: 'text', placeholder: 'e.g. O+' },
  { key: 'genotype', id: 'genotype', label: 'Genotype', type: 'text', placeholder: 'e.g. AA' },
  { key: 'allergies', id: 'allergies', label: 'Allergies', type: 'textarea' },
  { key: 'conditions', id: 'conditions', label: 'Medical Conditions', type: 'textarea' },
  { key: 'emergency_contact_name', id: 'emergency_contact_name', label: 'Emergency Contact Name', type: 'text' },
  { key: 'emergency_contact_phone', id: 'emergency_contact_phone', label: 'Emergency Contact Phone', type: 'text' },
];

export default function SuperAdminHealth() {
  const endpoints = useMemo(() => ({ students: '/academics/students' }), []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const students = data?.students || [];

  const [studentId, setStudentId] = useState('');
  const [record, setRecord] = useState(null);
  const [recordValues, setRecordValues] = useState(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordSaved, setRecordSaved] = useState(false);

  const [incidents, setIncidents] = useState(null);
  const [newIncident, setNewIncident] = useState({ description: '', action_taken: '' });
  const [savingIncident, setSavingIncident] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setRecord(null);
      setIncidents(null);
      return;
    }
    setRecord(null);
    setIncidents(null);
    api.get(`/student-services/health/students/${studentId}/record`).then((r) => {
      setRecord(r);
      setRecordValues(r);
    });
    api.get(`/student-services/health/students/${studentId}/incidents`).then(setIncidents);
  }, [studentId]);

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setSavingRecord(true);
    setRecordSaved(false);
    try {
      const updated = await api.put(`/student-services/health/students/${studentId}/record`, recordValues);
      setRecord(updated);
      setRecordSaved(true);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleAddIncident = async (e) => {
    e.preventDefault();
    if (!newIncident.description) return;
    setSavingIncident(true);
    try {
      await api.post(`/student-services/health/students/${studentId}/incidents`, newIncident);
      setNewIncident({ description: '', action_taken: '' });
      const list = await api.get(`/student-services/health/students/${studentId}/incidents`);
      setIncidents(list);
    } finally {
      setSavingIncident(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Health / Medical Records" title="Health / Medical Records" subtitle="Per-student health record and incident log." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div className="space-y-lg">
          <Card padding="lg" className="max-w-xl">
            <FormField
              field={{ key: 'student', id: 'health_student', label: 'Select Student', type: 'select', options: students.map((s) => ({ value: s.id, label: s.full_name })) }}
              value={studentId}
              onChange={setStudentId}
            />
          </Card>

          {!studentId ? (
            <Card padding="lg"><EmptyState icon="medical_services" text="Select a student to view their health record." /></Card>
          ) : !record ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">Loading…</p>
          ) : (
            <>
              <Card padding="lg" className="max-w-2xl">
                <h2 className="font-headline-md text-headline-md text-primary mb-md">Health Record</h2>
                <form onSubmit={handleSaveRecord} className="space-y-lg">
                  {recordSaved && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">Saved.</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {RECORD_FIELDS.map((field) => (
                      <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <FormField
                          field={field}
                          value={recordValues[field.key]}
                          onChange={(v) => { setRecordSaved(false); setRecordValues((p) => ({ ...p, [field.key]: v })); }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-md border-t border-outline/10">
                    <Button type="submit" variant="primary" disabled={savingRecord}>{savingRecord ? 'Saving…' : 'Save Record'}</Button>
                  </div>
                </form>
              </Card>

              <Card padding="lg" className="max-w-2xl">
                <h2 className="font-headline-md text-headline-md text-primary mb-md">Incident Log</h2>
                {incidents === null ? (
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Loading…</p>
                ) : incidents.length === 0 ? (
                  <EmptyState icon="fact_check" text="No data available yet" />
                ) : (
                  <div className="space-y-sm mb-md">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="p-md rounded-lg border border-outline/10">
                        <div className="flex items-center justify-between mb-xs">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{incident.date}</span>
                          {incident.recorded_by_name && <span className="font-label-sm text-label-sm text-outline">by {incident.recorded_by_name}</span>}
                        </div>
                        <p className="font-body-md text-body-md text-on-surface">{incident.description}</p>
                        {incident.action_taken && <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Action: {incident.action_taken}</p>}
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddIncident} className="space-y-md pt-md border-t border-outline/10">
                  <FormField field={{ key: 'description', id: 'incident_description', label: 'Record New Incident', type: 'textarea', required: true }} value={newIncident.description} onChange={(v) => setNewIncident((p) => ({ ...p, description: v }))} />
                  <FormField field={{ key: 'action_taken', id: 'incident_action', label: 'Action Taken', type: 'text' }} value={newIncident.action_taken} onChange={(v) => setNewIncident((p) => ({ ...p, action_taken: v }))} />
                  <div className="flex justify-end">
                    <Button type="submit" variant="secondary" disabled={savingIncident || !newIncident.description}>{savingIncident ? 'Saving…' : 'Add Incident'}</Button>
                  </div>
                </form>
              </Card>
            </>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
