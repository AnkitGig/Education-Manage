import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const FeeItemSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. Tuition Fee, Admission Fee, Activity Fee
    amount: { type: Number, required: true, default: 0 },
    frequency: { type: String, default: 'Annual' }, // Annual, One Time, Monthly, Term
  },
  { _id: false }
);

const InstallmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. 1st Installment
    amount: { type: Number, required: true, default: 0 },
    dueDate: { type: String, default: '' }, // e.g. 2026-04-10 or ISO string
  },
  { _id: false }
);

const S = new mongoose.Schema(
  {
    course: { type: ObjectId, ref: 'Course', required: true },
    className: { type: String, required: true },
    section: { type: String, default: 'All' },
    name: { type: String, default: '' }, // Fee Structure Name e.g. 'Class 5 - Regular'
    academicSession: { type: String, default: '2026 - 2027' },
    
    // Detailed items breakdown
    feeTypes: [FeeItemSchema],
    
    // Legacy support fields
    tuition: { type: Number, default: 0 },
    exam: { type: Number, default: 0 },
    lab: { type: Number, default: 0 },
    library: { type: Number, default: 0 },
    
    total: { type: Number, default: 0 },
    frequency: { type: String, default: 'yearly' },

    // Installment Plan
    enableInstallments: { type: Boolean, default: true },
    numberOfInstallments: { type: Number, default: 4 },
    installments: [InstallmentSchema],

    // Additional Settings
    applyLateFee: { type: Boolean, default: true },
    lateFeeAmount: { type: Number, default: 100 },
    lateFeePeriod: { type: String, default: 'Per Day' }, // Per Day, Per Week, One Time
    allowPartialPayment: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

S.pre('save', function (next) {
  if (this.feeTypes && this.feeTypes.length > 0) {
    this.total = this.feeTypes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  } else {
    this.total = (this.tuition || 0) + (this.exam || 0) + (this.lab || 0) + (this.library || 0);
  }
  next();
});

// Delete cached model in development to force re-compilation with new schema fields
if (mongoose.models.FeeStructure) {
  delete mongoose.models.FeeStructure;
}

export default mongoose.model('FeeStructure', S);
