import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const S = new mongoose.Schema(
  {
    staff: { type: ObjectId, ref: 'Staff', required: true },
    month: { type: String, required: true }, // YYYY-MM
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paymentMode: { type: String, enum: ['Bank Transfer', 'UPI', 'Cheque', 'Cash'], default: 'Bank Transfer' },
    transactionRef: String,
    paidOn: Date,
    remarks: String,
  },
  { timestamps: true }
);

S.index({ staff: 1, month: 1 }, { unique: true });

export default mongoose.models.Salary || mongoose.model('Salary', S);
