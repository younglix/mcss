import Landing from './pages/Public/Landing.jsx';
import LandingDesktop from './pages/Public/LandingDesktop.jsx';
import Login from './pages/Public/Login.jsx';
import ApplyIntro from './pages/Public/ApplyNow/Intro.jsx';
import ApplyBioData from './pages/Public/ApplyNow/BioDataForm.jsx';
import ApplyDocumentUpload from './pages/Public/ApplyNow/DocumentUpload.jsx';
import ApplyReviewSubmit from './pages/Public/ApplyNow/ReviewSubmit.jsx';
import ApplyConfirmation from './pages/Public/ApplyNow/Confirmation.jsx';
import ApplyStatusCheck from './pages/Public/ApplyNow/StatusCheck.jsx';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard.jsx';
import SuperAdminRolesPermissions from './pages/SuperAdmin/RolesPermissions.jsx';
import SuperAdminConfiguration from './pages/SuperAdmin/Configuration.jsx';
import SuperAdminStaff from './pages/SuperAdmin/Staff.jsx';
import SuperAdminSettings from './pages/SuperAdmin/Settings.jsx';
import SuperAdminAuditLog from './pages/SuperAdmin/AuditLog.jsx';
import SuperAdminApplicantApprovals from './pages/SuperAdmin/ApplicantApprovals.jsx';
import AdminDashboard from './pages/Admin/Dashboard.jsx';
import AdminStudentDirectory from './pages/Admin/Students/StudentDirectory.jsx';
import AdminLibraryDashboard from './pages/Admin/Library/Dashboard.jsx';
import AdminHostelDashboard from './pages/Admin/Hostel/Dashboard.jsx';
import AdminInventoryDashboard from './pages/Admin/Inventory/Dashboard.jsx';
import AdminReceptionDashboard from './pages/Admin/Reception/Dashboard.jsx';
import AdminRecruitmentDashboard from './pages/Admin/Recruitment/Dashboard.jsx';
import AdminMessDashboard from './pages/Admin/Mess/Dashboard.jsx';
import AdminTransportDashboard from './pages/Admin/Transport/Dashboard.jsx';
import AdminActivityDashboard from './pages/Admin/Activity/Dashboard.jsx';
import OfficialReportCard from './pages/Admin/Academics/ReportCard.jsx';
import StudentDashboard from './pages/Student/Dashboard.jsx';
import ParentDashboard from './pages/Parent/Dashboard.jsx';
import BursaryDashboard from './pages/Bursary/Dashboard.jsx';
import TeacherScoreEntry from './pages/Staff/Teacher/ScoreEntry.jsx';
import ClassTeacherOverview from './pages/Staff/ClassTeacher/ClassOverview.jsx';
import ExamOfficerMarksheet from './pages/Staff/ExamOfficer/MarksheetCompilation.jsx';
import LibraryAttendantDashboard from './pages/Staff/LibraryAttendant/Dashboard.jsx';

export const routes = [
  { path: "/", label: "Public Landing", source: "mcss_landing_page_mobile_elite", element: <Landing /> },
  { path: "/landing-desktop", label: "Public Desktop Landing", source: "mcss_landing_page", element: <LandingDesktop /> },
  { path: "/login", label: "Portal Login", source: "portal_login_mcss", element: <Login /> },
  { path: "/apply", label: "Apply Intro", source: "admission_application_intro", element: <ApplyIntro /> },
  { path: "/apply/bio-data", label: "Apply Bio Data", source: "admission_application_bio_data", element: <ApplyBioData /> },
  { path: "/apply/documents", label: "Apply Documents", source: "admission_application_document_upload", element: <ApplyDocumentUpload /> },
  { path: "/apply/review", label: "Apply Review", source: "admission_application_review_submit", element: <ApplyReviewSubmit /> },
  { path: "/apply/confirmation", label: "Apply Confirmation", source: "admission_application_confirmation", element: <ApplyConfirmation /> },
  { path: "/apply/status", label: "Apply Status", source: "admission_application_status_check", element: <ApplyStatusCheck /> },
  { path: "/super-admin", label: "Super Admin Dashboard", source: "super_admin_dashboard_platform_overview", element: <SuperAdminDashboard /> },
  { path: "/super-admin/roles", label: "Roles & Permissions", source: "roles_permissions_super_admin_portal", element: <SuperAdminRolesPermissions /> },
  { path: "/super-admin/staff", label: "Staff Management", source: "staff_management_super_admin_portal", element: <SuperAdminStaff /> },
  { path: "/super-admin/configuration", label: "School Configuration", source: "school_configuration_super_admin_portal", element: <SuperAdminConfiguration /> },
  { path: "/super-admin/settings", label: "System Settings", source: "platform_settings_super_admin", element: <SuperAdminSettings /> },
  { path: "/super-admin/audit", label: "Audit Log", source: "audit_log_super_admin_portal", element: <SuperAdminAuditLog /> },
  { path: "/super-admin/applicants", label: "Applicant Approvals", source: "applicant_approval_queue_super_admin", element: <SuperAdminApplicantApprovals /> },
  { path: "/admin", label: "Admin Dashboard", source: "admin_dashboard_responsive_mcss", element: <AdminDashboard /> },
  { path: "/admin/students", label: "Student Directory", source: "student_directory_admin_portal", element: <AdminStudentDirectory /> },
  { path: "/admin/library", label: "Library Admin", source: "library_portal_admin_dashboard", element: <AdminLibraryDashboard /> },
  { path: "/admin/hostel", label: "Hostel Admin", source: "hostel_management_admin_portal", element: <AdminHostelDashboard /> },
  { path: "/admin/inventory", label: "Inventory Admin", source: "inventory_management_admin_portal", element: <AdminInventoryDashboard /> },
  { path: "/admin/reception", label: "Reception Admin", source: "reception_front_desk_admin_portal", element: <AdminReceptionDashboard /> },
  { path: "/admin/recruitment", label: "Recruitment Admin", source: "recruitment_tracker_admin_portal", element: <AdminRecruitmentDashboard /> },
  { path: "/admin/mess", label: "Mess Admin", source: "mess_dining_management_admin_portal", element: <AdminMessDashboard /> },
  { path: "/admin/transport", label: "Transport Admin", source: "transport_logistics_admin_portal", element: <AdminTransportDashboard /> },
  { path: "/admin/activity", label: "Activity Admin", source: "activity_coordinator_event_management", element: <AdminActivityDashboard /> },
  { path: "/admin/academics/report-card", label: "Official Report Card", source: "official_report_card_responsive_mcss", element: <OfficialReportCard /> },
  { path: "/student", label: "Student Dashboard", source: "student_dashboard_mcss", element: <StudentDashboard /> },
  { path: "/parent", label: "Parent Dashboard", source: "parent_dashboard_mcss", element: <ParentDashboard /> },
  { path: "/bursary", label: "Bursary Dashboard", source: "bursary_dashboard_mcss", element: <BursaryDashboard /> },
  { path: "/staff/teacher", label: "Teacher Score Entry", source: "teacher_portal_responsive_score_entry", element: <TeacherScoreEntry /> },
  { path: "/staff/class-teacher", label: "Class Teacher Overview", source: "class_teacher_portal_my_class_overview", element: <ClassTeacherOverview /> },
  { path: "/staff/exam-officer", label: "Exam Officer Marksheet", source: "exam_officer_marksheet_compilation", element: <ExamOfficerMarksheet /> },
  { path: "/staff/library", label: "Library Attendant", source: "library_attendant_portal_scoped_view", element: <LibraryAttendantDashboard /> },
];
