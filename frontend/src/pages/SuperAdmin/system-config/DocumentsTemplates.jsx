import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';

const LINKS = [
  {
    icon: 'palette', title: 'Branding on Documents', description: 'Turn the school\'s logo and colors on or off for generated PDFs, report cards, invoices/receipts, and certificates.',
    to: '/super-admin/system-config/appearance', label: 'Appearance Settings',
  },
  {
    icon: 'receipt_long', title: 'Fee Receipts', description: 'Every payment can be downloaded as a real, branded PDF receipt.',
    to: '/super-admin/finance/receipts', label: 'Receipts',
  },
  {
    icon: 'confirmation_number', title: 'Numbering Formats', description: 'Admission numbers, staff IDs, invoice/receipt/expense numbers — configurable per document type.',
    to: '/super-admin/system-config/student-admission', label: 'Student & Admission Settings',
  },
  {
    icon: 'badge', title: 'Staff ID Format', description: 'The numbering format used for newly created staff records.',
    to: '/super-admin/system-config/staff-hr', label: 'Staff & HR Settings',
  },
  {
    icon: 'payments', title: 'Invoice / Receipt / Expense Numbers', description: 'Financial document numbering formats.',
    to: '/super-admin/system-config/finance', label: 'Finance Settings',
  },
];

export default function SuperAdminDocumentsTemplates() {
  return (
    <DashboardPageShell
      pageTitle="Documents & Templates"
      title="Documents & Templates"
      subtitle="Document numbering and PDF branding are configured across a few dedicated settings pages — this is the map."
      loading={false}
      error=""
      onReload={() => {}}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl">
        {LINKS.map((item) => (
          <Card key={item.to + item.label} padding="lg" className="flex flex-col gap-sm">
            <span className="material-symbols-outlined text-3xl text-primary">{item.icon}</span>
            <h2 className="font-headline-md text-headline-sm text-on-surface">{item.title}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant flex-1">{item.description}</p>
            <Link to={item.to} className="font-label-sm text-label-sm text-primary hover:underline">{item.label} →</Link>
          </Card>
        ))}
      </div>
    </DashboardPageShell>
  );
}
