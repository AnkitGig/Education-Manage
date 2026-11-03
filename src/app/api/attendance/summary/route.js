import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { dayKey } from '@/lib/utils';
import Attendance from '@/models/Attendance';

const count = (docs) => {
  const c = { present: 0, absent: 0, late: 0, total: 0 };
  docs.forEach((d) => d.records.forEach((r) => { c[r.status]++; c.total++; }));
  return c;
};

// ?date=YYYY-MM-DD -> day totals, 7-day trend, absent list
export const GET = wrap(async (req) => {
  const date = new URL(req.url).searchParams.get('date') || dayKey();
  const base = new Date(date + 'T00:00:00');
  const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() - (6 - i))));
  const docs = await Attendance.find({ date: { $in: days } })
    .populate({ path: 'records.student', select: 'name studentId photo parentMobile course batch', populate: [{ path: 'course', select: 'name' }, { path: 'batch', select: 'name' }] })
    .lean();
  const today = docs.filter((d) => d.date === date);
  const totals = count(today);
  const trend = days.map((d) => {
    const c = count(docs.filter((x) => x.date === d));
    return { date: d, label: d.slice(8) + '/' + d.slice(5, 7), percent: c.total ? Math.round(((c.present + c.late) / c.total) * 100) : 0 };
  });
  const absent = today.flatMap((d) => d.records.filter((r) => r.status === 'absent' && r.student).map((r) => r.student));
  return NextResponse.json({ totals: { ...totals, percent: totals.total ? Math.round(((totals.present + totals.late) / totals.total) * 100) : 0 }, trend, absent });
});

export const dynamic = 'force-dynamic';
