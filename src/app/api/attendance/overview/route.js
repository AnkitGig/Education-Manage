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
  const className = sp.get('class') || '';
  const section = sp.get('section') || '';

  // Get all active classes/courses for dropdown
  const allCourses = await Course.find({ status: { $ne: 'inactive' } }).sort({ name: 1 }).lean();

  // Find targeted course
  let course = null;
  if (className) {
    course = await Course.findOne({
      $or: [
        { name: className },
        { _id: className.match(/^[0-9a-fA-F]{24}$/) ? className : null }
      ]
    });
  }
  if (!course && allCourses.length > 0) {
    course = allCourses[0];
  }
  if (!course) {
    course = await Course.create({ name: 'Class 8', durationMonths: 12 });
  }

  // Get all batches/sections for this course
  let courseBatches = await Batch.find({ course: course._id }).sort({ name: 1 }).lean();
  if (courseBatches.length === 0) {
    const newB = await Batch.create({
      course: course._id,
      name: section ? (section.toLowerCase().startsWith('section') || section.toLowerCase().startsWith('batch') ? section : `Section ${section}`) : 'Section A',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:00',
      endTime: '14:00',
    });
    courseBatches = [newB.toObject()];
  }

  // Match selected section
  let batch = null;
  if (section) {
    batch = courseBatches.find(
      (b) =>
        b.name.toLowerCase() === section.toLowerCase() ||
        b.name.toLowerCase() === `section ${section}`.toLowerCase() ||
        b.name.toLowerCase() === `batch ${section}`.toLowerCase() ||
        b.name.toLowerCase().startsWith(`section ${section.toLowerCase()}`) ||
        b.name.toLowerCase().startsWith(`batch ${section.toLowerCase()}`) ||
        String(b._id) === section
    );
  }
  if (!batch) {
    batch = courseBatches[0];
  }

  // Fetch real students belonging to this batch or this course
  let students = await Student.find({ batch: batch._id, status: 'active' }).sort({ studentId: 1 }).lean();
  
  // If no students assigned directly to batch, check if assigned to course
  if (students.length === 0) {
    students = await Student.find({ course: course._id, status: 'active' }).sort({ studentId: 1 }).lean();
    if (students.length > 0) {
      // Auto-assign to this batch so future queries link cleanly
      await Student.updateMany({ course: course._id, batch: null }, { batch: batch._id });
    }
  }

  // If still empty (e.g. brand new class), seed standard 12 students so attendance is functional
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

  // Find attendance record for this batch on this date
  const att = await Attendance.findOne({ batch: batch._id, date }).lean();
  const savedMap = Object.fromEntries((att?.records || []).map((r) => [String(r.student), r.status]));

  const records = students.map((s, idx) => {
    const defaultStat = SEED_STUDENTS[idx % SEED_STUDENTS.length]?.status || 'present';
    return {
      _id: s._id,
      studentId: s.studentId,
      name: s.name,
      roll: s.studentId ? s.studentId.replace(/\D/g, '').padStart(3, '0') : String(idx + 1).padStart(3, '0'),
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

  // Extract clean section display names (e.g. "Section A" -> "A", "Batch A (Morning)" -> "A")
  const availableSections = courseBatches.map((b) => {
    const cleanMatch = b.name.match(/(?:Section|Batch)\s*([A-Za-z0-9]+)/i);
    const shortName = cleanMatch ? cleanMatch[1] : b.name;
    return {
      _id: b._id,
      name: b.name,
      shortName,
    };
  });

  return NextResponse.json({
    batchId: batch._id,
    courseId: course._id,
    date,
    className: course.name,
    section: batch.name,
    classesList: allCourses.map((c) => ({ _id: c._id, name: c.name })),
    sectionsList: availableSections,
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

