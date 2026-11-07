import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const S = new mongoose.Schema(
  {
    course: { type: ObjectId, ref: 'Course', required: true, unique: true },
    className: { type: String, required: true },
    tuition: { type: Number, default: 0 },
    exam: { type: Number, default: 0 },
    lab: { type: Number, default: 0 },
    library: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    frequency: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'], default: 'monthly' },
  },
  { timestamps: true }
);

S.pre('save', function (next) {
  this.total = (this.tuition || 0) + (this.exam || 0) + (this.lab || 0) + (this.library || 0);
  next();
});

export default mongoose.models.FeeStructure || mongoose.model('FeeStructure', S);

