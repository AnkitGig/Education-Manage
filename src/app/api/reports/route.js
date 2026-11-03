import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth, lastMonths, dayKey } from '@/lib/utils';
import { monthFinance, financeTrend } from '@/lib/finance';
import Student from '@/models/Student';
import Batch from '@/models/Batch';
import Teacher from '@/models/Teacher';
import Attendance from '@/models/Attendance';

export const GET = wrap(async (req) => {
  const month = new URL(req.url).searchParams.get('month') || curMonth();
  const t0 = new Date();
  const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - (6 - i))));

  const [students, batches, teachers, trend, current, byCourse, att, growth] = await Promise.all([
    Student.countDocuments(), Batch.countDocuments(), Teacher.countDocuments({ status: { $ne: 'inactive' } }),
    financeTrend(6), monthFinance(month),
    Student.aggregate([
      { $group: { _id: '$course', n: { $sum: 1 } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' }, { $project: { name: '$c.name', n: 1 } }, { $sort: { n: -1 } },
    ]),
    Attendance.find({ date: { $in: days } }).lean(),
    Promise.all(lastMonths(6).map((mm) => { const [yy, mo] = mm.split('-').map(Number); return Student.countDocuments({ createdAt: { $lt: new Date(yy, mo, 1) } }).then((count) => ({ label: new Date(yy, mo - 1, 1).toLocaleString('en-IN', { month: 'short' }), count })); })),
  ]);

  const attendanceTrend = days.map((d) => {
    let p = 0, t = 0;
    att.filter((a) => a.date === d).forEach((a) => a.records.forEach((r) => { t++; if (r.status !== 'absent') p++; }));
    return { label: d.slice(8) + '/' + d.slice(5, 7), percent: t ? Math.round((p / t) * 100) : 0, has: !!t };
  });
  const withData = attendanceTrend.filter((a) => a.has);
  const avgAttendance = withData.length ? Math.round(withData.reduce((s, a) => s + a.percent, 0) / withData.length) : 0;

  return NextResponse.json({ students, batches, teachers, avgAttendance, trend, current, byCourse, attendanceTrend, growth });
});

export const dynamic = 'force-dynamic';
