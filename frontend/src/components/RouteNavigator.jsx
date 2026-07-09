import { NavLink } from 'react-router-dom';

const groups = [
  ['Public', ['/','/landing-desktop','/login','/apply','/apply/bio-data','/apply/documents','/apply/review','/apply/confirmation','/apply/status']],
  ['Super Admin', ['/super-admin','/super-admin/schools','/super-admin/staff','/super-admin/settings','/super-admin/applicants']],
  ['Admin', ['/admin','/admin/students','/admin/library','/admin/hostel','/admin/inventory','/admin/reception','/admin/recruitment','/admin/mess','/admin/transport','/admin/activity','/admin/academics/report-card']],
  ['Portals', ['/student','/parent','/bursary']],
  ['Staff', ['/staff/teacher','/staff/class-teacher','/staff/exam-officer','/staff/library']],
];

export default function RouteNavigator({ routes }) {
  const byPath = new Map(routes.map((route) => [route.path, route]));

  return (
    <aside className="mcss-route-navigator" aria-label="MCSS screen routes">
      <details>
        <summary>
          <span className="material-symbols-outlined" aria-hidden="true">apps</span>
          Screens
        </summary>
        <div className="mcss-route-panel">
          {groups.map(([group, paths]) => (
            <section key={group}>
              <h2>{group}</h2>
              <div>
                {paths.map((path) => {
                  const route = byPath.get(path);
                  if (!route) return null;
                  return (
                    <NavLink key={path} to={path} end={path === '/'}>
                      {route.label}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </details>
    </aside>
  );
}
