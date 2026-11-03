import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const S = new mongoose.Schema(
  {
    teacher: { type: ObjectId, ref: 'Teacher', required: true },
    month: { type: String, required: true }, // YYYY-MM
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidOn: Date,
  },
  { timestamps: true }
);
S.index({ teacher: 1, month: 1 }, { unique: true });
export default mongoose.models.Salary || mongoose.model('Salary', S);
