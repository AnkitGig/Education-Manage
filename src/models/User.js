import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'teacher', 'accounts'], default: 'admin' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLogin: Date,
  },
  { timestamps: true }
);
export default mongoose.models.User || mongoose.model('User', S);
