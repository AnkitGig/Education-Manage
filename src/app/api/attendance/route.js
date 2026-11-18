import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';

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
  await Attendance.findOneAndUpdate({ batch, date }, { batch, date, records }, { upsert: true, new: true });
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';
