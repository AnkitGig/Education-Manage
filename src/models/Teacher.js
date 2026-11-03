import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    teacherId: { type: String, unique: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    role: { type: String, default: 'Teacher' }, // Teacher | Senior Teacher
    subjects: [String],
    salary: { type: Number, default: 0 },
    paymentType: { type: String, default: 'Fixed Monthly' },
    joiningDate: Date,
    photo: { url: String, publicId: String },
    status: { type: String, enum: ['active', 'onleave', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);
export default mongoose.models.Teacher || mongoose.model('Teacher', S);
