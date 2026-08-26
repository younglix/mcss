import Landing from './pages/Public/Landing.jsx';
import LandingDesktop from './pages/Public/LandingDesktop.jsx';
import Login from './pages/Public/Login.jsx';
import ApplyIntro from './pages/Public/ApplyNow/Intro.jsx';
import ApplyBioData from './pages/Public/ApplyNow/BioDataForm.jsx';
import ApplyDocumentUpload from './pages/Public/ApplyNow/DocumentUpload.jsx';
import ApplyReviewSubmit from './pages/Public/ApplyNow/ReviewSubmit.jsx';
import ApplyConfirmation from './pages/Public/ApplyNow/Confirmation.jsx';
import ApplyStatusCheck from './pages/Public/ApplyNow/StatusCheck.jsx';
import SuperAdminOverview from './pages/SuperAdmin/dashboard/Overview.jsx';
import SuperAdminFinancialSummary from './pages/SuperAdmin/dashboard/FinancialSummary.jsx';
import SuperAdminAcademicSummary from './pages/SuperAdmin/dashboard/AcademicSummary.jsx';
import SuperAdminOperationsSummary from './pages/SuperAdmin/dashboard/OperationsSummary.jsx';
import SuperAdminRecentActivities from './pages/SuperAdmin/dashboard/RecentActivities.jsx';
import SuperAdminNotifications from './pages/SuperAdmin/dashboard/Notifications.jsx';
import SuperAdminRolesPermissions from './pages/SuperAdmin/RolesPermissions.jsx';
import SuperAdminSchoolConfiguration from './pages/SuperAdmin/administration/SchoolConfiguration.jsx';
import SuperAdminAcademicSessionTerms from './pages/SuperAdmin/administration/AcademicSessionTerms.jsx';
import SuperAdminClassesArms from './pages/SuperAdmin/administration/ClassesArms.jsx';
import SuperAdminDepartments from './pages/SuperAdmin/administration/Departments.jsx';
import SuperAdminStaffManagement from './pages/SuperAdmin/administration/StaffManagement.jsx';
import SuperAdminUserManagement from './pages/SuperAdmin/administration/UserManagement.jsx';
import SuperAdminReception from './pages/SuperAdmin/administration/Reception.jsx';
import SuperAdminCommunication from './pages/SuperAdmin/administration/Communication.jsx';
import SuperAdminCalendar from './pages/SuperAdmin/administration/Calendar.jsx';
import SuperAdminWebsiteCms from './pages/SuperAdmin/administration/WebsiteCms.jsx';
import SuperAdminStudents from './pages/SuperAdmin/academic/Students.jsx';
import SuperAdminTeachers from './pages/SuperAdmin/academic/Teachers.jsx';
import SuperAdminSubjects from './pages/SuperAdmin/academic/Subjects.jsx';
import SuperAdminClasses from './pages/SuperAdmin/academic/Classes.jsx';
import SuperAdminTimetable from './pages/SuperAdmin/academic/Timetable.jsx';
import SuperAdminAttendance from './pages/SuperAdmin/academic/Attendance.jsx';
import SuperAdminExams from './pages/SuperAdmin/academic/Exams.jsx';
import SuperAdminResults from './pages/SuperAdmin/academic/Results.jsx';
import SuperAdminAssignments from './pages/SuperAdmin/academic/Assignments.jsx';
import SuperAdminPromotion from './pages/SuperAdmin/academic/Promotion.jsx';
import SuperAdminAcademicReports from './pages/SuperAdmin/academic/AcademicReports.jsx';
import SuperAdminLibrary from './pages/SuperAdmin/student-services/Library.jsx';
import SuperAdminHostel from './pages/SuperAdmin/student-services/Hostel.jsx';
import SuperAdminTransport from './pages/SuperAdmin/student-services/Transport.jsx';
import SuperAdminMess from './pages/SuperAdmin/student-services/Mess.jsx';
import SuperAdminActivities from './pages/SuperAdmin/student-services/Activities.jsx';
import SuperAdminResources from './pages/SuperAdmin/student-services/Resources.jsx';
import SuperAdminHealth from './pages/SuperAdmin/student-services/Health.jsx';
import SuperAdminSchoolFees from './pages/SuperAdmin/finance/SchoolFees.jsx';
import SuperAdminFeeStructures from './pages/SuperAdmin/finance/FeeStructures.jsx';
import SuperAdminInvoices from './pages/SuperAdmin/finance/Invoices.jsx';
import SuperAdminPayments from './pages/SuperAdmin/finance/Payments.jsx';
import SuperAdminReceipts from './pages/SuperAdmin/finance/Receipts.jsx';
import SuperAdminExpenses from './pages/SuperAdmin/finance/Expenses.jsx';
import SuperAdminPayroll from './pages/SuperAdmin/finance/Payroll.jsx';
import SuperAdminFinancialReports from './pages/SuperAdmin/finance/FinancialReports.jsx';
import SuperAdminHR from './pages/SuperAdmin/operations/HR.jsx';
import SuperAdminRecruitment from './pages/SuperAdmin/operations/Recruitment.jsx';
import SuperAdminInventory from './pages/SuperAdmin/operations/Inventory.jsx';
import SuperAdminAssets from './pages/SuperAdmin/operations/Assets.jsx';
import SuperAdminGeneralSettings from './pages/SuperAdmin/system-config/General.jsx';
import SuperAdminAppearanceSettings from './pages/SuperAdmin/system-config/Appearance.jsx';
import SuperAdminAcademicSettings from './pages/SuperAdmin/system-config/Academic.jsx';
import SuperAdminStudentAdmissionSettings from './pages/SuperAdmin/system-config/StudentAdmission.jsx';
import SuperAdminStaffHRSettings from './pages/SuperAdmin/system-config/StaffHR.jsx';
import SuperAdminFinanceSettings from './pages/SuperAdmin/system-config/Finance.jsx';
import SuperAdminCommunicationSettings from './pages/SuperAdmin/system-config/Communication.jsx';
import SuperAdminUsersSecuritySettings from './pages/SuperAdmin/system-config/UsersSecurity.jsx';
import SuperAdminFormsCustomFields from './pages/SuperAdmin/system-config/FormsCustomFields.jsx';
import SuperAdminDocumentsTemplates from './pages/SuperAdmin/system-config/DocumentsTemplates.jsx';
import SuperAdminWebsiteSettings from './pages/SuperAdmin/system-config/Website.jsx';
import SuperAdminSystemMaintenance from './pages/SuperAdmin/system-config/SystemMaintenance.jsx';
import SuperAdminIntegrations from './pages/SuperAdmin/system-config/Integrations.jsx';
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
  { path: "/super-admin", label: "Super Admin Dashboard", source: "super_admin_dashboard_platform_overview", element: <SuperAdminOverview /> },
  { path: "/super-admin/financial-summary", label: "Financial Summary", source: "super_admin_dashboard_financial_summary", element: <SuperAdminFinancialSummary /> },
  { path: "/super-admin/academic-summary", label: "Academic Summary", source: "super_admin_dashboard_academic_summary", element: <SuperAdminAcademicSummary /> },
  { path: "/super-admin/operations-summary", label: "Operations Summary", source: "super_admin_dashboard_operations_summary", element: <SuperAdminOperationsSummary /> },
  { path: "/super-admin/recent-activities", label: "Recent Activities", source: "super_admin_dashboard_recent_activities", element: <SuperAdminRecentActivities /> },
  { path: "/super-admin/notifications", label: "Notifications", source: "super_admin_dashboard_notifications", element: <SuperAdminNotifications /> },
  { path: "/super-admin/roles", label: "Roles & Permissions", source: "roles_permissions_super_admin_portal", element: <SuperAdminRolesPermissions /> },
  { path: "/super-admin/configuration", label: "School Configuration", source: "school_configuration_super_admin_portal", element: <SuperAdminSchoolConfiguration /> },
  { path: "/super-admin/administration/academic-session-terms", label: "Academic Session & Terms", source: "super_admin_academic_session_terms", element: <SuperAdminAcademicSessionTerms /> },
  { path: "/super-admin/administration/classes-arms", label: "Classes & Arms", source: "super_admin_classes_arms", element: <SuperAdminClassesArms /> },
  { path: "/super-admin/administration/departments", label: "Departments", source: "super_admin_departments", element: <SuperAdminDepartments /> },
  { path: "/super-admin/staff", label: "Staff Management", source: "staff_management_super_admin_portal", element: <SuperAdminStaffManagement /> },
  { path: "/super-admin/administration/user-management", label: "User Management", source: "super_admin_user_management", element: <SuperAdminUserManagement /> },
  { path: "/super-admin/administration/reception", label: "Reception", source: "super_admin_reception", element: <SuperAdminReception /> },
  { path: "/super-admin/administration/communication", label: "Communication", source: "super_admin_communication", element: <SuperAdminCommunication /> },
  { path: "/super-admin/administration/calendar", label: "Calendar", source: "super_admin_calendar", element: <SuperAdminCalendar /> },
  { path: "/super-admin/administration/website-cms", label: "Website / CMS", source: "super_admin_website_cms", element: <SuperAdminWebsiteCms /> },
  { path: "/super-admin/academic/students", label: "Students", source: "super_admin_academic_students", element: <SuperAdminStudents /> },
  { path: "/super-admin/academic/teachers", label: "Teachers", source: "super_admin_academic_teachers", element: <SuperAdminTeachers /> },
  { path: "/super-admin/academic/subjects", label: "Subjects", source: "super_admin_academic_subjects", element: <SuperAdminSubjects /> },
  { path: "/super-admin/academic/classes", label: "Classes", source: "super_admin_academic_classes", element: <SuperAdminClasses /> },
  { path: "/super-admin/academic/timetable", label: "Timetable", source: "super_admin_academic_timetable", element: <SuperAdminTimetable /> },
  { path: "/super-admin/academic/attendance", label: "Attendance", source: "super_admin_academic_attendance", element: <SuperAdminAttendance /> },
  { path: "/super-admin/academic/exams", label: "Exams", source: "super_admin_academic_exams", element: <SuperAdminExams /> },
  { path: "/super-admin/academic/results", label: "Results / Marksheets", source: "super_admin_academic_results", element: <SuperAdminResults /> },
  { path: "/super-admin/academic/assignments", label: "Assignments", source: "super_admin_academic_assignments", element: <SuperAdminAssignments /> },
  { path: "/super-admin/academic/promotion", label: "Promotion", source: "super_admin_academic_promotion", element: <SuperAdminPromotion /> },
  { path: "/super-admin/academic/reports", label: "Academic Reports", source: "super_admin_academic_reports", element: <SuperAdminAcademicReports /> },
  { path: "/super-admin/student-services/library", label: "Library", source: "super_admin_student_services_library", element: <SuperAdminLibrary /> },
  { path: "/super-admin/student-services/hostel", label: "Hostel", source: "super_admin_student_services_hostel", element: <SuperAdminHostel /> },
  { path: "/super-admin/student-services/transport", label: "Transport", source: "super_admin_student_services_transport", element: <SuperAdminTransport /> },
  { path: "/super-admin/student-services/mess", label: "School Meals / Mess", source: "super_admin_student_services_mess", element: <SuperAdminMess /> },
  { path: "/super-admin/student-services/activities", label: "Activities", source: "super_admin_student_services_activities", element: <SuperAdminActivities /> },
  { path: "/super-admin/student-services/resources", label: "Student Resources", source: "super_admin_student_services_resources", element: <SuperAdminResources /> },
  { path: "/super-admin/student-services/health", label: "Health / Medical Records", source: "super_admin_student_services_health", element: <SuperAdminHealth /> },
  { path: "/super-admin/finance/school-fees", label: "School Fees", source: "super_admin_finance_school_fees", element: <SuperAdminSchoolFees /> },
  { path: "/super-admin/finance/fee-structures", label: "Fee Structures", source: "super_admin_finance_fee_structures", element: <SuperAdminFeeStructures /> },
  { path: "/super-admin/finance/invoices", label: "Invoices", source: "super_admin_finance_invoices", element: <SuperAdminInvoices /> },
  { path: "/super-admin/finance/payments", label: "Payments", source: "super_admin_finance_payments", element: <SuperAdminPayments /> },
  { path: "/super-admin/finance/receipts", label: "Receipts", source: "super_admin_finance_receipts", element: <SuperAdminReceipts /> },
  { path: "/super-admin/finance/expenses", label: "Expenses", source: "super_admin_finance_expenses", element: <SuperAdminExpenses /> },
  { path: "/super-admin/finance/payroll", label: "Payroll", source: "super_admin_finance_payroll", element: <SuperAdminPayroll /> },
  { path: "/super-admin/finance/reports", label: "Financial Reports", source: "super_admin_finance_reports", element: <SuperAdminFinancialReports /> },
  { path: "/super-admin/operations/hr", label: "HR", source: "super_admin_operations_hr", element: <SuperAdminHR /> },
  { path: "/super-admin/operations/recruitment", label: "Recruitment", source: "super_admin_operations_recruitment", element: <SuperAdminRecruitment /> },
  { path: "/super-admin/operations/inventory", label: "Inventory", source: "super_admin_operations_inventory", element: <SuperAdminInventory /> },
  { path: "/super-admin/operations/assets", label: "Assets", source: "super_admin_operations_assets", element: <SuperAdminAssets /> },
  { path: "/super-admin/system-config/general", label: "General Settings", source: "super_admin_system_config_general", element: <SuperAdminGeneralSettings /> },
  { path: "/super-admin/system-config/appearance", label: "Appearance Settings", source: "super_admin_system_config_appearance", element: <SuperAdminAppearanceSettings /> },
  { path: "/super-admin/system-config/academic", label: "Academic Settings", source: "super_admin_system_config_academic", element: <SuperAdminAcademicSettings /> },
  { path: "/super-admin/system-config/student-admission", label: "Student & Admission Settings", source: "super_admin_system_config_student_admission", element: <SuperAdminStudentAdmissionSettings /> },
  { path: "/super-admin/system-config/staff-hr", label: "Staff & HR Settings", source: "super_admin_system_config_staff_hr", element: <SuperAdminStaffHRSettings /> },
  { path: "/super-admin/system-config/finance", label: "Finance Settings", source: "super_admin_system_config_finance", element: <SuperAdminFinanceSettings /> },
  { path: "/super-admin/system-config/communication", label: "Communication Settings", source: "super_admin_system_config_communication", element: <SuperAdminCommunicationSettings /> },
  { path: "/super-admin/system-config/users-security", label: "Users & Security Settings", source: "super_admin_system_config_users_security", element: <SuperAdminUsersSecuritySettings /> },
  { path: "/super-admin/system-config/forms", label: "Forms & Custom Fields", source: "super_admin_system_config_forms", element: <SuperAdminFormsCustomFields /> },
  { path: "/super-admin/system-config/documents", label: "Documents & Templates", source: "super_admin_system_config_documents", element: <SuperAdminDocumentsTemplates /> },
  { path: "/super-admin/system-config/website", label: "Website Settings", source: "super_admin_system_config_website", element: <SuperAdminWebsiteSettings /> },
  { path: "/super-admin/system-config/maintenance", label: "System & Maintenance", source: "super_admin_system_config_maintenance", element: <SuperAdminSystemMaintenance /> },
  { path: "/super-admin/system-config/integrations", label: "Integrations", source: "super_admin_system_config_integrations", element: <SuperAdminIntegrations /> },
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
