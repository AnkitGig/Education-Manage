import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    title: String,
    docType: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const S = new mongoose.Schema(
  {
    staffId: { type: String, unique: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    type: { type: String, enum: ['Teaching', 'Non-Teaching'], default: 'Teaching' },
    role: { type: String, default: 'Teacher' },
    department: { type: String, default: 'Academics' },
    subjects: [String],
    assignedClasses: [String],
    salary: { type: Number, default: 0 },
    paymentType: { type: String, default: 'Fixed Monthly' },
    joiningDate: { type: Date, default: Date.now },
    photo: { url: String, publicId: String },
    status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
    documents: [DocumentSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Staff || mongoose.model('Staff', S);
