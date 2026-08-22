import AppShell from '../../components/layout/AppShell.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { classes, feeCategories, gradeScale, schoolProfile, sessions } from './configurationData.js';

const fieldClasses = 'mcss-field w-full px-md';

export default function SuperAdminConfiguration() {
  return (
    <AppShell portalId="superAdmin" pageTitle="School Configuration" user={{ name: 'Super Admin' }}>
      <div className="space-y-lg sm:space-y-xl">
        <PageHeader
          title="School Configuration"
          subtitle="The academic structure every other module reads from — sessions, classes, grading, and fee categories."
        />

        <Card padding="lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-md text-headline-md text-primary">School Profile</h2>
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="md:col-span-2">
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Institution Name</label>
              <input className={fieldClasses} type="text" defaultValue={schoolProfile.name} />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Motto</label>
              <input className={fieldClasses} type="text" defaultValue={schoolProfile.motto} />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Phone</label>
              <input className={fieldClasses} type="text" defaultValue={schoolProfile.phone} />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Email</label>
              <input className={fieldClasses} type="email" defaultValue={schoolProfile.email} />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-xs block">Address</label>
              <input className={fieldClasses} type="text" defaultValue={schoolProfile.address} />
            </div>
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="px-lg py-md border-b border-outline/10 bg-surface-container-low flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">Academic Sessions</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Exactly one session and one term are current at any time.</p>
            </div>
            <Button variant="secondary" size="sm" iconLeft="add">
              New Session
            </Button>
          </div>
          <div className="divide-y divide-outline/10">
            {sessions.map((session) => (
              <div key={session.id} className="p-lg">
                <div className="flex flex-wrap items-center gap-sm mb-md">
                  <h3 className="font-headline-md text-headline-sm text-on-surface">{session.name}</h3>
                  {session.isCurrent && (
                    <Badge tone="success" variant="ribbon">
                      Current Session
                    </Badge>
                  )}
                  <span className="font-label-sm text-label-sm text-outline">
                    {session.startDate} – {session.endDate}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                  {session.terms.map((term) => (
                    <div
                      key={term.id}
                      className={`p-md rounded-lg border ${term.isCurrent ? 'border-primary bg-primary/5' : 'border-outline/10'}`}
                    >
                      <div className="flex items-center justify-between mb-xs">
                        <span className="font-label-md text-label-md font-bold text-on-surface">{term.name} Term</span>
                        {term.isCurrent && <span className="material-symbols-outlined text-primary text-body-md">check_circle</span>}
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {term.startDate} – {term.endDate}
                      </p>
                      {!term.isCurrent && (
                        <button type="button" className="font-label-sm text-label-sm text-primary hover:underline mt-xs">
                          Set as current
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline-md text-headline-md text-primary">Classes & Arms</h2>
              <Button variant="secondary" size="sm" iconLeft="add">
                New Class
              </Button>
            </div>
            <div className="space-y-sm">
              {classes.map((klass) => (
                <div key={klass.id} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
                  <span className="font-label-md text-label-md font-bold text-on-surface">{klass.name}</span>
                  <div className="flex flex-wrap gap-xs justify-end">
                    {klass.arms.map((arm) => (
                      <span key={arm} className="font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        {arm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline-md text-headline-md text-primary">Fee Categories</h2>
              <Button variant="secondary" size="sm" iconLeft="add">
                New Category
              </Button>
            </div>
            <div className="space-y-sm">
              {feeCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
                  <span className="font-label-md text-label-md font-bold text-on-surface">{category.name}</span>
                  <Badge tone={category.isRecurring ? 'secondary' : 'tertiary'}>{category.isRecurring ? 'Recurring' : 'One-off'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="px-lg py-md border-b border-outline/10 bg-surface-container-low">
            <h2 className="font-headline-md text-headline-md text-primary">Grading Scale</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-125 text-left border-collapse">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Grade</th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Score Range</th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Remark</th>
                  <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {gradeScale.map((grade) => (
                  <tr key={grade.name} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-3 font-body-md text-body-md font-bold text-on-surface">{grade.name}</td>
                    <td className="px-lg py-3 font-body-md text-body-md text-on-surface-variant">
                      {grade.minScore}–{grade.maxScore}
                    </td>
                    <td className="px-lg py-3 font-body-md text-body-md text-on-surface-variant">{grade.remark}</td>
                    <td className="px-lg py-3 font-body-md text-body-md text-on-surface-variant text-right">{grade.gradePoint.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
