import mongoose from 'mongoose';
const S = new mongoose.Schema(
  { category: { type: String, required: true }, amount: { type: Number, required: true }, date: { type: Date, default: Date.now }, note: String },
  { timestamps: true }
);
export default mongoose.models.Expense || mongoose.model('Expense', S);
