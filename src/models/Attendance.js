import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const S = new mongoose.Schema(
  {
    batch: { type: ObjectId, ref: 'Batch', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    records: [{ student: { type: ObjectId, ref: 'Student' }, status: { type: String, enum: ['present', 'absent', 'late'] }, _id: false }],
  },
  { timestamps: true }
);
S.index({ batch: 1, date: 1 }, { unique: true });
export default mongoose.models.Attendance || mongoose.model('Attendance', S);
