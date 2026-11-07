import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Batch from '@/models/Batch';

const SEED_STUDENTS = [
  { roll: '001', name: 'Aarav Sharma', status: 'present' },
  { roll: '002', name: 'Ananya Verma', status: 'present' },
  { roll: '003', name: 'Rohan Mehta', status: 'absent' },
  { roll: '004', name: 'Kavya Singh', status: 'present' },
  { roll: '005', name: 'Aditya Gupta', status: 'late' },
  { roll: '006', name: 'Ishita Patel', status: 'present' },
  { roll: '007', name: 'Vivaan Joshi', status: 'present' },
  { roll: '008', name: 'Diya Malhotra', status: 'halfday' },
  { roll: '009', name: 'Aryan Choudhary', status: 'present' },
  { roll: '010', name: 'Sneha Rao', status: 'present' },
  { roll: '011', name: 'Kabir Kapoor', status: 'present' },
  { roll: '012', name: 'Pooja Nair', status: 'present' },
];

export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const date = sp.get('date') || new Date().toISOString().slice(0, 10);
  const className = sp.get('class') || 'Class 8';
  const section = sp.get('section') || 'A';

  // Find or create default batch
  let course = await Course.findOne({ name: className });
  if (!course) {
    course = await Course.create({ name: className, duration: '1 Year', fee: 24000 });
  }

  let batch = await Batch.findOne({ course: course._id, name: `Section ${section}` });
  if (!batch) {
    batch = await Batch.create({
      course: course._id,
      name: `Section ${section}`,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:00',
      endTime: '14:00',
    });
  }

  // Ensure students exist
  let students = await Student.find({ batch: batch._id, status: 'active' }).sort({ studentId: 1 }).lean();
  if (students.length === 0) {
    for (let i = 0; i < SEED_STUDENTS.length; i++) {
      const s = SEED_STUDENTS[i];
      const sid = `STD${s.roll}`;
      await Student.create({
        studentId: sid,
        name: s.name,
        course: course._id,
        batch: batch._id,
        mobile: `+91 98${i}${i}4 55667`,
        parentName: `${s.name.split(' ')[1]} Senior`,
        parentMobile: `+91 97${i}${i}1 22334`,
        status: 'active',
      });
    }
    students = await Student.find({ batch: batch._id, status: 'active' }).sort({ studentId: 1 }).lean();
  }

  // Find attendance record for this date
  const att = await Attendance.findOne({ batch: batch._id, date }).lean();
  const savedMap = Object.fromEntries((att?.records || []).map((r) => [String(r.student), r.status]));

  const records = students.map((s, idx) => {
    const defaultStat = SEED_STUDENTS[idx]?.status || 'present';
    return {
      _id: s._id,
      studentId: s.studentId,
      name: s.name,
      roll: s.studentId.replace(/\D/g, '').padStart(3, '0') || String(idx + 1).padStart(3, '0'),
      photo: s.photo,
      status: savedMap[String(s._id)] || defaultStat,
    };
  });

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const halfDayCount = records.filter((r) => r.status === 'halfday').length;
  const total = records.length;
  const percent = total ? Math.round(((presentCount + lateCount + halfDayCount) / total) * 100) : 0;

  return NextResponse.json({
    batchId: batch._id,
    courseId: course._id,
    date,
    className,
    section,
    students: records,
    stats: {
      total,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      halfDay: halfDayCount,
      rate: `${percent}%`,
      attendanceRate: percent,
    },
  });
});

export const POST = wrap(async (req) => {
  await connectDB();
  const { batchId, date, records } = await req.json();
  const updated = await Attendance.findOneAndUpdate(
    { batch: batchId, date },
    { batch: batchId, date, records },
    { upsert: true, new: true }
  );
  return NextResponse.json({ ok: true, data: updated });
});

export const dynamic = 'force-dynamic';

