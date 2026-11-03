import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: String,
    type: { type: String, enum: ['general', 'exam', 'holiday', 'event'], default: 'general' },
    audience: [String], // students | parents | teachers
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft' },
    scheduledAt: Date,
    publishedAt: Date,
    views: { type: Number, default: 0 },
    whatsapp: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.models.Notice || mongoose.model('Notice', S);
