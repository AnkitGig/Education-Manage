import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const S = new mongoose.Schema(
  {
    studentId: { type: String, unique: true },
    name: { type: String, required: true },
    dob: Date,
    gender: String,
    bloodGroup: String,
    mobile: String,
    parentName: { type: String, required: true },
    parentRelation: String,
    parentMobile: { type: String, required: true },
    email: String,
    address: String,
    photo: { url: String, publicId: String },
    documents: [{ name: String, url: String, publicId: String }],
    course: { type: ObjectId, ref: 'Course', required: true },
    batch: { type: ObjectId, ref: 'Batch', required: true },
    feePlan: { type: String, default: 'monthly' },
    feeAmount: { type: Number, default: 0 },
    admissionDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'onhold', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);
export default mongoose.models.Student || mongoose.model('Student', S);
