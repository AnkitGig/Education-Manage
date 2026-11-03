import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    board: String,
    durationMonths: { type: Number, default: 12 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    // plan: monthly | quarterly | half_yearly | yearly
    fees: [{ plan: String, amount: Number, months: Number, _id: false }],
  },
  { timestamps: true }
);
export default mongoose.models.Course || mongoose.model('Course', S);
