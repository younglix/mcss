import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import FormField from '../../components/ui/FormField.jsx';
import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, ApiError } from '../../lib/api.js';

export default function HRCommunication() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    setSendMessage('');
    try {
      const result = await api.post('/notifications/broadcast', { title, body, audience: 'staff' });
      setSendMessage(`Sent to ${result.recipient_count} staff member(s).`);
      setTitle('');
      setBody('');
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Could not send this message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell portalId="hr" pageTitle="Communication" user={{ name: user?.full_name || 'HR' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader title="Communication" subtitle="Send a message to every staff member — it lands in their Notifications." />

        <Card padding="lg" className="max-w-2xl">
          <form onSubmit={handleSend} className="space-y-lg">
            {sendError && <p className="font-label-md text-label-md text-error bg-error-container/20 border border-error/20 rounded-lg px-md py-sm">{sendError}</p>}
            {sendMessage && <p className="font-label-md text-label-md text-secondary bg-secondary-container/20 border border-secondary/20 rounded-lg px-md py-sm">{sendMessage}</p>}
            <FormField field={{ key: 'title', label: 'Title', type: 'text', required: true }} value={title} onChange={setTitle} />
            <FormField field={{ key: 'body', label: 'Message', type: 'textarea', rows: 5, required: true }} value={body} onChange={setBody} />
            <div className="flex justify-end pt-md border-t border-outline/10">
              <Button type="submit" variant="primary" iconLeft="campaign" disabled={sending || !title || !body}>
                {sending ? 'Sending…' : 'Send to All Staff'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
