import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { sendBulk, fill } from '@/lib/whatsapp';
import { DEFAULT_TEMPLATES } from '@/lib/templates';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Institute from '@/models/Institute';
import Template from '@/models/Template';

// ?batch=&date=YYYY-MM-DD  -> students of the batch with saved (or default "present") status
export const GET = wrap(async (req) => {
  const sp = new URL(req.url).searchParams;
  const batch = sp.get('batch'), date = sp.get('date');
  if (!batch || !date) return bad('batch and date are required');
  const [students, att] = await Promise.all([
    Student.find({ batch, status: 'active' }).sort({ studentId: 1 }).select('name studentId photo').lean(),
    Attendance.findOne({ batch, date }).lean(),
  ]);
  const map = Object.fromEntries((att?.records || []).map((r) => [String(r.student), r.status]));
  return NextResponse.json({ students: students.map((s) => ({ ...s, status: map[s._id] || 'present' })), saved: !!att });
});

// { batch, date, records:[{student,status}] }
export const POST = wrap(async (req) => {
  const { batch, date, records } = await req.json();
  if (!batch || !date || !Array.isArray(records)) return bad('Invalid data');
  const prev = await Attendance.findOne({ batch, date }).lean();
  const wasAbsent = new Set((prev?.records || []).filter((r) => r.status === 'absent').map((r) => String(r.student)));
  await Attendance.findOneAndUpdate({ batch, date }, { batch, date, records }, { upsert: true, new: true });

  // WhatsApp alert for newly absent students
  const inst = await Institute.findOne().lean();
  const newAbsent = records.filter((r) => r.status === 'absent' && !wasAbsent.has(String(r.student))).map((r) => r.student);
  let alerted = 0;
  if (newAbsent.length && inst?.automation?.attendanceAlert !== false) {
    const t = (await Template.findOne({ key: 'attendance' }).lean()) || DEFAULT_TEMPLATES.find((x) => x.key === 'attendance');
    const list = await Student.find({ _id: { $in: newAbsent } }).populate('course', 'name').populate('batch', 'name').lean();
    const res = await sendBulk({
      title: 'Attendance alert – auto', template: 'attendance',
      items: list.map((s) => ({ to: s.parentMobile, text: fill(t.body, { parent: s.parentName, student: s.name, course: s.course?.name, batch: s.batch?.name, date, institute: inst?.name || '' }) })),
    });
    alerted = res.sent;
  }
  return NextResponse.json({ ok: true, alerted });
});

export const dynamic = 'force-dynamic';
