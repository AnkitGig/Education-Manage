import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const S = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'Student', required: true, index: true },
    month: { type: String, index: true }, // YYYY-MM
    plan: String,
    amount: { type: Number, required: true },
    paid: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, default: 'due' },
    payments: [{ amount: Number, mode: String, date: { type: Date, default: Date.now }, receiptNo: String, note: String }],
  },
  { timestamps: true }
);
S.pre('save', function (next) {
  this.status = this.paid >= this.amount ? 'paid' : this.paid > 0 ? 'partial' : 'due';
  next();
});
export default mongoose.models.FeeRecord || mongoose.model('FeeRecord', S);
