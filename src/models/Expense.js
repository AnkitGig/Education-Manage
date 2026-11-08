import mongoose from 'mongoose';

const S = new mongoose.Schema(
  {
    title: { type: String },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: ['Bank Transfer', 'UPI', 'Cheque', 'Cash'], default: 'UPI' },
    vendor: String,
    invoiceNo: String,
    invoiceUrl: String,
    note: String,
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model('Expense', S);
