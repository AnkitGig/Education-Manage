import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Batch from '@/models/Batch';

export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const date = sp.get('date') || new Date().toISOString().slice(0, 10);
  const className = sp.get('class') || '';
  const section = sp.get('section') || '';

  // Get all active classes/courses for dropdown
  const allCourses = await Course.find({ status: { $ne: 'inactive' } }).sort({ name: 1 }).lean();

  if (allCourses.length === 0) {
    return NextResponse.json({
      batchId: null,
      courseId: null,
      date,
      className: '',
      section: '',
      classesList: [],
      sectionsList: [],
      students: [],
      stats: { total: 0, present: 0, absent: 0, late: 0, halfDay: 0, rate: '0%', attendanceRate: 0 },
    });
  }

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
  if (!course) {
    course = allCourses[0];
  }

  // Get all batches/sections for this course
  const courseBatches = await Batch.find({ course: course._id }).sort({ name: 1 }).lean();
  if (courseBatches.length === 0) {
    return NextResponse.json({
      batchId: null,
      courseId: course._id,
      date,
      className: course.name,
      section: '',
      classesList: allCourses.map((c) => ({ _id: c._id, name: c.name })),
      sectionsList: [],
      students: [],
      stats: { total: 0, present: 0, absent: 0, late: 0, halfDay: 0, rate: '0%', attendanceRate: 0 },
    });
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
  if (students.length === 0) {
    students = await Student.find({ course: course._id, status: 'active' }).sort({ studentId: 1 }).lean();
  }

  // Find attendance record for this batch on this date
  const att = await Attendance.findOne({ batch: batch._id, date }).lean();
  const savedMap = Object.fromEntries((att?.records || []).map((r) => [String(r.student), r.status]));

  const records = students.map((s, idx) => {
    return {
      _id: s._id,
      studentId: s.studentId,
      name: s.name,
      roll: s.studentId ? s.studentId.replace(/\D/g, '').padStart(3, '0') : String(idx + 1).padStart(3, '0'),
      photo: s.photo,
      status: savedMap[String(s._id)] || 'present',
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

