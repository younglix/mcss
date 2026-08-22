// Mirrors the default keys seeded by apps/settings_app management command
// `seed_settings` (see backend/apps/settings_app/management/commands/seed_settings.py).
export const settingGroups = [
  {
    group: 'sms',
    label: 'SMS',
    icon: 'sms',
    fields: [
      { key: 'sms.provider', label: 'Provider', type: 'text', value: '' },
      { key: 'sms.sender_id', label: 'Sender ID', type: 'text', value: '' },
      { key: 'sms.api_key', label: 'API Key', type: 'secret', value: '' },
    ],
  },
  {
    group: 'email',
    label: 'Email',
    icon: 'mail',
    fields: [
      { key: 'email.host', label: 'SMTP Host', type: 'text', value: '' },
      { key: 'email.from', label: 'From Address', type: 'text', value: '' },
      { key: 'email.password', label: 'SMTP Password', type: 'secret', value: '' },
    ],
  },
  {
    group: 'payments',
    label: 'Payments',
    icon: 'payments',
    fields: [
      { key: 'payments.paystack.public_key', label: 'Paystack Public Key', type: 'text', value: '' },
      { key: 'payments.paystack.secret_key', label: 'Paystack Secret Key', type: 'secret', value: '' },
      { key: 'payments.flutterwave.public_key', label: 'Flutterwave Public Key', type: 'text', value: '' },
      { key: 'payments.flutterwave.secret_key', label: 'Flutterwave Secret Key', type: 'secret', value: '' },
    ],
  },
  {
    group: 'numbering',
    label: 'Numbering Formats',
    icon: 'tag',
    fields: [
      { key: 'numbering.admission_format', label: 'Admission Number', type: 'text', value: 'MC/{year}/{seq:04}' },
      { key: 'numbering.receipt_format', label: 'Receipt Number', type: 'text', value: 'RCT/{year}/{seq:05}' },
      { key: 'numbering.invoice_format', label: 'Invoice Number', type: 'text', value: 'INV/{year}/{seq:05}' },
    ],
  },
  {
    group: 'result',
    label: 'Results',
    icon: 'grading',
    fields: [
      { key: 'result.pass_mark', label: 'Pass Mark', type: 'number', value: 50 },
      { key: 'result.show_position', label: 'Show class position on report cards', type: 'toggle', value: true },
      { key: 'result.lock_after_publish', label: 'Lock results after publishing', type: 'toggle', value: true },
    ],
  },
  {
    group: 'notifications',
    label: 'Notifications',
    icon: 'notifications_active',
    fields: [
      { key: 'notifications.absentee_alert_enabled', label: 'Alert parents on unmarked absence', type: 'toggle', value: false },
    ],
  },
];
