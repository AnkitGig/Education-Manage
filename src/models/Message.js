import mongoose from 'mongoose';
const S = new mongoose.Schema(
  {
    title: String,
    template: String,
    body: String,
    recipients: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    status: { type: String, enum: ['sent', 'scheduled', 'failed'], default: 'sent' },
    sentAt: Date,
  },
  { timestamps: true }
);
export default mongoose.models.Message || mongoose.model('Message', S);
