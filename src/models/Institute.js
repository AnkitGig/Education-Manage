import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    name: { type: String, default: 'My Coaching Institute' },
    regNo: String,
    phone: String,
    email: String,
    address: String,
    website: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    type: { type: String, default: 'Coaching Institute' },
    board: { type: String, default: 'CBSE' },
    academicYear: { type: String, default: '2026 – 2027' },
    language: { type: String, default: 'English + Hindi' },
    logo: { url: String, publicId: String },
    automation: {
      feeReminder: { type: Boolean, default: true },
      attendanceAlert: { type: Boolean, default: true },
      paymentConfirmation: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
    },
    system: {
      emailNotifications: { type: Boolean, default: true },
      portalAccess: { type: Boolean, default: true },
      mobileAccess: { type: Boolean, default: true },
      autoBackup: { type: Boolean, default: true },
    },
    plan: {
      name: { type: String, default: 'Standard' },
      price: { type: Number, default: 399 },
      maxStudents: { type: Number, default: 500 },
      validTill: { type: Date, default: () => new Date(Date.now() + 30 * 864e5) },
    },
  },
  { timestamps: true }
);
export default mongoose.models.Institute || mongoose.model('Institute', S);
