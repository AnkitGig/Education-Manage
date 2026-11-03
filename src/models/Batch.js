import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const S = new mongoose.Schema(
  {
    name: { type: String, required: true },
    course: { type: ObjectId, ref: 'Course', required: true },
    teacher: { type: ObjectId, ref: 'Teacher' },
    startTime: String, // "08:00"
    endTime: String, // "10:00"
    days: [String], // Mon, Tue ...
    room: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    timetable: [{ day: String, subject: String, _id: false }],
  },
  { timestamps: true }
);
export default mongoose.models.Batch || mongoose.model('Batch', S);
