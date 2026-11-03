export const DEFAULT_TEMPLATES = [
  { key: 'fee_due', title: 'Fee Due Reminder', description: 'Monthly fee reminder with due date',
    body: 'Dear {{parent}},\n\nThis is a reminder that the fee for {{student}} ({{course}} – {{batch}}) of ₹{{amount}} is due on {{dueDate}}.\n\nPlease make the payment at the earliest.\n\nThank you,\n{{institute}}' },
  { key: 'attendance', title: 'Attendance Alert', description: 'Student absent notification',
    body: 'Dear {{parent}},\n\n{{student}} ({{course}} – {{batch}}) was absent from class on {{date}}. Please contact us if this is unexpected.\n\n{{institute}}' },
  { key: 'payment', title: 'Payment Confirmation', description: 'Fee payment received confirmation',
    body: 'Dear {{parent}},\n\nWe have received ₹{{amount}} for {{student}} (Receipt {{receipt}}). Thank you!\n\n{{institute}}' },
  { key: 'announcement', title: 'General Announcement', description: 'Send important updates to parents',
    body: 'Dear {{parent}},\n\n{{message}}\n\n{{institute}}' },
  { key: 'birthday', title: 'Birthday Wish', description: 'Send birthday wishes to students',
    body: 'Happy Birthday {{student}}! 🎉 Wishing you a wonderful year ahead.\n\n{{institute}}' },
  { key: 'exam', title: 'Exam Schedule', description: 'Exam or test schedule notification',
    body: 'Dear {{parent}},\n\n{{message}}\n\nRegards,\n{{institute}}' },
];
