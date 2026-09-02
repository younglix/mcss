PERMISSIONS = {
    "students":   ["view", "create", "edit", "delete", "export"],
    "attendance": ["view", "create", "edit"],
    "results":    ["view", "enter", "edit", "approve", "publish"],
    "fees":       ["view", "create", "edit", "delete", "collect", "refund", "waive", "verify", "reconcile", "remind"],
    "staff":      ["view", "create", "edit", "delete"],
    "payroll":    ["view", "run", "approve"],
    "config":     ["view", "edit"],
    "settings":   ["view", "edit"],
    "roles":      ["view", "create", "edit", "delete", "assign"],
    "users":      ["view", "create", "edit", "delete", "reset_password"],
    "audit":        ["view"],
    "dashboard":    ["view"],
    "reception":    ["view", "create", "edit", "delete"],
    "calendar":     ["view", "create", "edit", "delete"],
    "cms":          ["view", "edit"],
    "communication": ["view", "send"],
    "subjects":     ["view", "create", "edit", "delete"],
    "teachers":     ["view", "assign"],
    "classes":      ["view", "assign"],
    "timetable":    ["view", "create", "edit", "delete"],
    "exams":        ["view", "create", "edit", "delete"],
    "assignments":  ["view", "create", "edit", "delete"],
    "promotion":    ["view", "action"],
    "reports":      ["view"],
    "expenses":     ["view", "create", "edit", "delete"],
    "income":       ["view", "create", "edit", "delete"],
    "discounts":    ["view", "apply", "delete"],
    "scholarships": ["view", "manage"],
    "library":      ["view", "create", "edit", "delete"],
    "hostel":       ["view", "create", "edit", "delete", "allocate"],
    "transport":    ["view", "create", "edit", "delete", "assign"],
    "mess":         ["view", "create", "edit", "delete"],
    "activities":   ["view", "create", "edit", "delete", "enroll"],
    "resources":    ["view", "create", "edit", "delete"],
    "health":       ["view", "create", "edit", "delete"],
    "discipline":   ["view", "create", "edit", "delete"],
    "hr":           ["view", "create", "edit", "delete", "approve"],
    "staff_attendance": ["view", "create", "edit"],
    "contracts":    ["view", "create", "edit", "delete"],
    "performance":  ["view", "create", "edit", "delete"],
    "recruitment":  ["view", "create", "edit", "delete"],
    "inventory":    ["view", "create", "edit", "delete"],
    "assets":       ["view", "create", "edit", "delete", "assign"],
    "admissions":   ["view", "edit", "review"],
    "custom_fields": ["view", "edit"],
    "exam": ["view", "questions_submit", "bank_approve", "config_edit", "activate", "attempt_reset", "grading_edit", "monitor"],
    # ...expands per module as later phases land
}


def flatten_permissions():
    """Yields (code, module, action) for every permission in the registry."""
    for module, actions in PERMISSIONS.items():
        for action in actions:
            yield f"{module}.{action}", module, action


# Default role -> permission-code bundles (spec Section 33). Super Admin is
# excluded on purpose: it bypasses RBAC entirely via User.is_superadmin.
DEFAULT_ROLES = {
    "principal": {
        "name": "Principal",
        "description": "Full academic and operational oversight for the school.",
        "permissions": [code for code, *_ in flatten_permissions()],
    },
    "teacher": {
        "name": "Teacher",
        "description": "Classroom-facing staff: attendance and results entry.",
        "permissions": [
            "students.view", "attendance.view", "attendance.create", "attendance.edit",
            "results.view", "results.enter", "results.edit",
            "subjects.view", "classes.view", "timetable.view",
            "exams.view", "assignments.view", "assignments.create", "assignments.edit", "assignments.delete",
            # CBE question authoring — approving/configuring/running the
            # exam itself is the Exam Officer's job, not the teacher's.
            "exam.view", "exam.questions_submit",
        ],
    },
    "exam_officer": {
        "name": "Exam Officer",
        "description": "Approves question banks, configures and runs computer-based exams.",
        "permissions": [
            "exam.view", "exam.bank_approve", "exam.config_edit", "exam.activate",
            "exam.attempt_reset", "exam.grading_edit", "exam.monitor",
            "subjects.view", "classes.view", "students.view", "exams.view", "results.view",
            "config.view", "dashboard.view",
        ],
    },
    "accountant": {
        "name": "Accountant",
        "description": "Bursary staff: fee collection and financial records.",
        "permissions": [
            "students.view", "fees.view", "fees.create", "fees.edit", "fees.delete",
            "fees.collect", "fees.refund", "fees.waive", "fees.verify", "fees.reconcile", "fees.remind",
            "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
            "income.view", "income.create", "income.edit", "income.delete",
            "discounts.view", "discounts.apply", "discounts.delete",
            "scholarships.view", "scholarships.manage",
            # Read-only reference data every finance screen's pickers need
            # (fee categories, classes, sessions/terms) — not config.edit,
            # so the bursar still can't touch school-wide configuration.
            "config.view", "classes.view",
            "dashboard.view", "reports.view",
        ],
    },
    "hr": {
        "name": "HR",
        "description": "Staff lifecycle and payroll administration.",
        "permissions": [
            # Employee Records — was "staff.*", a permission module nothing
            # actually checks; Staff Management/UserManagementPage is
            # gated by users.* (plus roles.view/assign and custom_fields.*
            # for the same screen's role-toggle and staff custom fields).
            "users.view", "users.create", "users.edit", "users.delete", "users.reset_password",
            "roles.view", "roles.assign",
            "custom_fields.view", "custom_fields.edit",
            "hr.view", "hr.create", "hr.edit", "hr.delete", "hr.approve",
            "staff_attendance.view", "staff_attendance.create", "staff_attendance.edit",
            "contracts.view", "contracts.create", "contracts.edit", "contracts.delete",
            "performance.view", "performance.create", "performance.edit", "performance.delete",
            "recruitment.view", "recruitment.create", "recruitment.edit", "recruitment.delete",
            "payroll.view", "payroll.run", "payroll.approve",
            # Departments live under config.* (no dedicated module) — same
            # read-only-by-default trade-off as Accountant's config.view,
            # but HR also gets config.edit since managing department
            # structure is explicitly part of this role's job.
            "config.view", "config.edit",
            "communication.view", "communication.send",
            "dashboard.view", "reports.view",
        ],
    },
    "student": {
        "name": "Student",
        "description": "Self-service access to own academic records.",
        "permissions": ["results.view", "attendance.view"],
    },
    "parent": {
        "name": "Parent",
        "description": "Self-service access to their children's records.",
        "permissions": ["results.view", "attendance.view", "fees.view"],
    },
}
