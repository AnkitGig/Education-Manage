import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth, feeStatus } from '@/lib/utils';
import FeeRecord from '@/models/FeeRecord';

// ?month=YYYY-MM&status=paid|partial|due|overdue&course=&batch=&q=&page=&limit=
export const GET = wrap(async (req) => {
  const sp = new URL(req.url).searchParams;
  const month = sp.get('month') || curMonth();
  const page = +sp.get('page') || 1, limit = +sp.get('limit') || 10;
  let recs = await FeeRecord.find({ month })
    .populate({ path: 'student', select: 'name studentId photo course batch parentMobile', populate: [{ path: 'course', select: 'name' }, { path: 'batch', select: 'name' }] })
    .sort({ createdAt: -1 }).lean();
  recs = recs.filter((r) => r.student).map((r) => ({ ...r, status: feeStatus(r), due: r.amount - r.paid }));

  recs.sort((a, b) => (a.status === 'paid') - (b.status === 'paid'));
  const total = recs.reduce((s, r) => s + r.amount, 0);
  const collected = recs.reduce((s, r) => s + r.paid, 0);
  const stats = { total, collected, pending: total - collected, paidStudents: recs.filter((r) => r.status === 'paid').length, students: recs.length };

  const status = sp.get('status'), course = sp.get('course'), batch = sp.get('batch'), q = (sp.get('q') || '').toLowerCase();
  if (status && status !== 'all') recs = recs.filter((r) => r.status === status);
  if (course) recs = recs.filter((r) => String(r.student.course?._id) === course);
  if (batch) recs = recs.filter((r) => String(r.student.batch?._id) === batch);
  if (q) recs = recs.filter((r) => r.student.name.toLowerCase().includes(q) || r.student.studentId.toLowerCase().includes(q) || (r.student.parentMobile || '').includes(q));

  return NextResponse.json({ data: recs.slice((page - 1) * limit, page * limit), total: recs.length, pages: Math.ceil(recs.length / limit) || 1, stats });
});

export const dynamic = 'force-dynamic';
