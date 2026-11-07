import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const S = new mongoose.Schema(
  {
    staff: { type: ObjectId, ref: 'Staff', required: true },
    leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'], default: 'Casual Leave' },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true }, // YYYY-MM-DD
    days: { type: Number, default: 1 },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    reviewedBy: String,
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.models.StaffLeave || mongoose.model('StaffLeave', S);

