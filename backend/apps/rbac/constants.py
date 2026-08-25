PERMISSIONS = {
    "students":   ["view", "create", "edit", "delete", "export"],
    "attendance": ["view", "create", "edit"],
    "results":    ["view", "enter", "edit", "approve", "publish"],
    "fees":       ["view", "create", "collect", "refund", "waive"],
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
        ],
    },
    "accountant": {
        "name": "Accountant",
        "description": "Bursary staff: fee collection and financial records.",
        "permissions": [
            "students.view", "fees.view", "fees.create", "fees.collect",
            "fees.refund", "fees.waive", "dashboard.view",
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
