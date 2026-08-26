PERMISSIONS = {
    "students":   ["view", "create", "edit", "delete", "export"],
    "attendance": ["view", "create", "edit"],
    "results":    ["view", "enter", "edit", "approve", "publish"],
    "fees":       ["view", "create", "edit", "delete", "collect", "refund", "waive"],
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
    "library":      ["view", "create", "edit", "delete"],
    "hostel":       ["view", "create", "edit", "delete", "allocate"],
    "transport":    ["view", "create", "edit", "delete", "assign"],
    "mess":         ["view", "create", "edit", "delete"],
    "activities":   ["view", "create", "edit", "delete", "enroll"],
    "resources":    ["view", "create", "edit", "delete"],
    "health":       ["view", "create", "edit", "delete"],
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
        ],
    },
    "accountant": {
        "name": "Accountant",
        "description": "Bursary staff: fee collection and financial records.",
        "permissions": [
            "students.view", "fees.view", "fees.create", "fees.edit", "fees.delete",
            "fees.collect", "fees.refund", "fees.waive",
            "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
            "dashboard.view", "reports.view",
        ],
    },
    "hr": {
        "name": "HR",
        "description": "Staff records and payroll administration.",
        "permissions": ["staff.view", "staff.create", "staff.edit", "payroll.view", "payroll.run"],
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
