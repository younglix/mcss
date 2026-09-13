import { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import DashboardPageShell from '../../SuperAdmin/dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../../SuperAdmin/dashboard/useDashboardData.js';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { settings: '/exam/settings' };

/** Super Admin/Exam Officer > Exam Settings — currently just the minimum
 * question-bank size QuestionBankApproveView enforces before a bank can be
 * approved for use in a CBE exam. Its own page (not folded into the
 * generic Settings tab) since Exam Officer holds exam.config_edit but not
 * the blanket settings.edit the generic tab is gated by. */
export default function ExamOfficerSettings() {
  const { data, loading, error, reload } = useDashboardData(ENDPOINTS);
  const [minBankSize, setMinBankSize] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const value = minBankSize ?? (data?.settings ? String(data.settings.min_bank_size) : '');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const result = await api.post('/exam/settings', { min_bank_size: value });
      setMinBankSize(String(result.min_bank_size));
      setSaveMessage('Exam settings saved.');
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save exam settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardPageShell
      portalId="examOfficer"
      pageTitle="Exam Settings"
      title="Exam Settings"
      subtitle="School-wide rules the CBE exam workflow enforces."
      loading={loading}
      error={error}
      onReload={reload}
      skeletonCount={1}
    >
      {data && (
        <Card padding="lg" className="max-w-lg">
          <div className="space-y-md">
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="minBankSize">
                Minimum Question Bank Size
              </label>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-sm">
                A question bank can't be approved for use in a CBE exam until it has at least this many questions.
              </p>
              <input
                id="minBankSize"
                type="number"
                min="1"
                value={value}
                onChange={(e) => setMinBankSize(e.target.value)}
                className="mcss-field px-md w-40"
              />
            </div>
            {saveError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{saveError}</p>}
            {saveMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">{saveMessage}</p>}
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={saving || !value}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </DashboardPageShell>
  );
}
