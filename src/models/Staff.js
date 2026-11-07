import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const S = new mongoose.Schema(
  {
    staffId: { type: String, unique: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    type: { type: String, enum: ['Teaching', 'Non-Teaching'], default: 'Teaching' },
    role: { type: String, default: 'Teacher' }, // Teacher, Senior Teacher, Accountant, Admin Staff, Librarian, Lab Assistant, Peon, Security, etc.
    department: { type: String, default: 'Academics' }, // Academics, Administration, Finance, Operations, Library, etc.
    subjects: [String], // e.g. Mathematics, Science, English
    assignedClasses: [String], // e.g. Class 8 A, Class 9 B
    salary: { type: Number, default: 0 },
    paymentType: { type: String, default: 'Fixed Monthly' },
    joiningDate: { type: Date, default: Date.now },
    photo: { url: String, publicId: String },
    status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
    documents: [
      {
        title: String,
        type: String, // Resume, ID Proof, Degree, Contract, Police Verification
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Staff || mongoose.model('Staff', S);

