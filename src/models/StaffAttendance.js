import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const S = new mongoose.Schema(
  {
    staff: { type: ObjectId, ref: 'Staff', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'On Leave'], default: 'Present' },
    checkIn: String, // HH:MM
    checkOut: String, // HH:MM
    notes: String,
  },
  { timestamps: true }
);

S.index({ staff: 1, date: 1 }, { unique: true });

export default mongoose.models.StaffAttendance || mongoose.model('StaffAttendance', S);

