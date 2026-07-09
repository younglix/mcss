import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const exportRoot = path.join(root, 'stitch_mount_carmel_management_system');
const srcRoot = path.join(process.cwd(), 'src');
const pagesRoot = path.join(srcRoot, 'pages');
const referencesRoot = path.join(srcRoot, 'assets', 'references');

const screens = [
  ['mcss_landing_page_mobile_elite', 'Public/Landing.jsx', 'Landing', '/', 'Public Landing'],
  ['mcss_landing_page', 'Public/LandingDesktop.jsx', 'LandingDesktop', '/landing-desktop', 'Public Desktop Landing'],
  ['portal_login_mcss', 'Public/Login.jsx', 'Login', '/login', 'Portal Login'],
  ['admission_application_intro', 'Public/ApplyNow/Intro.jsx', 'ApplyIntro', '/apply', 'Apply Intro'],
  ['admission_application_bio_data', 'Public/ApplyNow/BioDataForm.jsx', 'ApplyBioData', '/apply/bio-data', 'Apply Bio Data'],
  ['admission_application_document_upload', 'Public/ApplyNow/DocumentUpload.jsx', 'ApplyDocumentUpload', '/apply/documents', 'Apply Documents'],
  ['admission_application_review_submit', 'Public/ApplyNow/ReviewSubmit.jsx', 'ApplyReviewSubmit', '/apply/review', 'Apply Review'],
  ['admission_application_confirmation', 'Public/ApplyNow/Confirmation.jsx', 'ApplyConfirmation', '/apply/confirmation', 'Apply Confirmation'],
  ['admission_application_status_check', 'Public/ApplyNow/StatusCheck.jsx', 'ApplyStatusCheck', '/apply/status', 'Apply Status'],
  ['super_admin_dashboard_platform_overview', 'SuperAdmin/Dashboard.jsx', 'SuperAdminDashboard', '/super-admin', 'Super Admin Dashboard'],
  ['school_management_super_admin_portal', 'SuperAdmin/Schools.jsx', 'SuperAdminSchools', '/super-admin/schools', 'School Management'],
  ['staff_management_super_admin_portal', 'SuperAdmin/Staff.jsx', 'SuperAdminStaff', '/super-admin/staff', 'Staff Management'],
  ['platform_settings_super_admin', 'SuperAdmin/Settings.jsx', 'SuperAdminSettings', '/super-admin/settings', 'Platform Settings'],
  ['applicant_approval_queue_super_admin', 'SuperAdmin/ApplicantApprovals.jsx', 'SuperAdminApplicantApprovals', '/super-admin/applicants', 'Applicant Approvals'],
  ['admin_dashboard_responsive_mcss', 'Admin/Dashboard.jsx', 'AdminDashboard', '/admin', 'Admin Dashboard'],
  ['student_directory_admin_portal', 'Admin/Students/StudentDirectory.jsx', 'AdminStudentDirectory', '/admin/students', 'Student Directory'],
  ['library_portal_admin_dashboard', 'Admin/Library/Dashboard.jsx', 'AdminLibraryDashboard', '/admin/library', 'Library Admin'],
  ['hostel_management_admin_portal', 'Admin/Hostel/Dashboard.jsx', 'AdminHostelDashboard', '/admin/hostel', 'Hostel Admin'],
  ['inventory_management_admin_portal', 'Admin/Inventory/Dashboard.jsx', 'AdminInventoryDashboard', '/admin/inventory', 'Inventory Admin'],
  ['reception_front_desk_admin_portal', 'Admin/Reception/Dashboard.jsx', 'AdminReceptionDashboard', '/admin/reception', 'Reception Admin'],
  ['recruitment_tracker_admin_portal', 'Admin/Recruitment/Dashboard.jsx', 'AdminRecruitmentDashboard', '/admin/recruitment', 'Recruitment Admin'],
  ['mess_dining_management_admin_portal', 'Admin/Mess/Dashboard.jsx', 'AdminMessDashboard', '/admin/mess', 'Mess Admin'],
  ['transport_logistics_admin_portal', 'Admin/Transport/Dashboard.jsx', 'AdminTransportDashboard', '/admin/transport', 'Transport Admin'],
  ['activity_coordinator_event_management', 'Admin/Activity/Dashboard.jsx', 'AdminActivityDashboard', '/admin/activity', 'Activity Admin'],
  ['official_report_card_responsive_mcss', 'Admin/Academics/ReportCard.jsx', 'OfficialReportCard', '/admin/academics/report-card', 'Official Report Card'],
  ['student_dashboard_mcss', 'Student/Dashboard.jsx', 'StudentDashboard', '/student', 'Student Dashboard'],
  ['parent_dashboard_mcss', 'Parent/Dashboard.jsx', 'ParentDashboard', '/parent', 'Parent Dashboard'],
  ['bursary_dashboard_mcss', 'Bursary/Dashboard.jsx', 'BursaryDashboard', '/bursary', 'Bursary Dashboard'],
  ['teacher_portal_responsive_score_entry', 'Staff/Teacher/ScoreEntry.jsx', 'TeacherScoreEntry', '/staff/teacher', 'Teacher Score Entry'],
  ['class_teacher_portal_my_class_overview', 'Staff/ClassTeacher/ClassOverview.jsx', 'ClassTeacherOverview', '/staff/class-teacher', 'Class Teacher Overview'],
  ['exam_officer_marksheet_compilation', 'Staff/ExamOfficer/MarksheetCompilation.jsx', 'ExamOfficerMarksheet', '/staff/exam-officer', 'Exam Officer Marksheet'],
  ['library_attendant_portal_scoped_view', 'Staff/LibraryAttendant/Dashboard.jsx', 'LibraryAttendantDashboard', '/staff/library', 'Library Attendant'],
];

function pick(source, startPattern, endPattern) {
  const start = source.search(startPattern);
  if (start === -1) return '';
  const after = source.slice(start);
  const end = after.search(endPattern);
  return end === -1 ? after : after.slice(0, end);
}

function extractBody(source) {
  const match = source.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!match) return { bodyClass: '', body: source };
  const classMatch = match[1].match(/\sclass=(["'])(.*?)\1/i);
  return { bodyClass: classMatch?.[2] ?? '', body: match[2].trim() };
}

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
}

function extractStyles(source) {
  const styles = [];
  for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    styles.push(match[1].trim());
  }
  return styles;
}

function pageFile(screen) {
  const [folder, relativeFile, component, route, title] = screen;
  const htmlPath = path.join(exportRoot, folder, 'code.html');
  const pngPath = path.join(exportRoot, folder, 'screen.png');
  const source = readFileSync(htmlPath, 'utf8');
  const { bodyClass, body } = extractBody(source);
  const bodyHtml = stripScripts(body);
  const outPath = path.join(pagesRoot, relativeFile);
  mkdirSync(path.dirname(outPath), { recursive: true });
  if (existsSync(pngPath)) {
    const assetDir = path.join(referencesRoot, folder);
    mkdirSync(assetDir, { recursive: true });
    copyFileSync(pngPath, path.join(assetDir, 'screen.png'));
  }
  writeFileSync(
    outPath,
    `import StitchScreen from '${'../'.repeat(relativeFile.split('/').length - 1)}../components/StitchScreen.jsx';\n\n` +
      `const html = ${JSON.stringify(bodyHtml)};\n\n` +
      `export default function ${component}() {\n` +
      `  return <StitchScreen title=${JSON.stringify(title)} bodyClassName=${JSON.stringify(bodyClass)} html={html} />;\n` +
      `}\n`,
  );
  return { folder, relativeFile, component, route, title, bytes: source.length, styles: extractStyles(source) };
}

rmSync(pagesRoot, { recursive: true, force: true });
mkdirSync(pagesRoot, { recursive: true });
mkdirSync(referencesRoot, { recursive: true });

const generated = screens.map(pageFile);

const routeImports = generated
  .map(({ component, relativeFile }) => `import ${component} from './pages/${relativeFile.replace(/\\/g, '/')}';`)
  .join('\n');
const routeItems = generated
  .map(({ component, route, title, folder }) => `  { path: ${JSON.stringify(route)}, label: ${JSON.stringify(title)}, source: ${JSON.stringify(folder)}, element: <${component} /> },`)
  .join('\n');

writeFileSync(
  path.join(srcRoot, 'routes.jsx'),
  `${routeImports}\n\nexport const routes = [\n${routeItems}\n];\n`,
);

const styleBlocks = [...new Set(generated.flatMap((item) => item.styles))];
writeFileSync(
  path.join(srcRoot, 'stitch-exported.css'),
  `/* Custom CSS blocks extracted from Google Stitch exports. */\n${styleBlocks.join('\n\n')}\n`,
);

const inventory = generated
  .map(({ folder, route, title, bytes }) => `- [x] ${title} \`${folder}/code.html\` -> \`${route}\` (${bytes} bytes, PNG copied)`)
  .join('\n');

writeFileSync(
  path.join(process.cwd(), 'SCREEN_INVENTORY.md'),
  `# Stitch Screen Inventory\n\nConverted screens: ${generated.length}\n\n${inventory}\n\nSkipped:\n- [ ] \`institutional_heritage\` has no \`code.html\` and no \`screen.png\`.\n`,
);

console.log(`Generated ${generated.length} React page components.`);
