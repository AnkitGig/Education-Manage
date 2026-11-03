import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth } from '@/lib/utils';
import Teacher from '@/models/Teacher';
import Salary from '@/models/Salary';

// ?month=YYYY-MM -> payroll rows ;  ?teacher=ID -> salary history of one teacher
export const GET = wrap(async (req) => {
  const sp = new URL(req.url).searchParams;
  if (sp.get('teacher')) {
    const data = await Salary.find({ teacher: sp.get('teacher') }).sort({ month: -1 }).lean();
    return NextResponse.json({ data });
  }
  const month = sp.get('month') || curMonth();
  const [teachers, rows] = await Promise.all([Teacher.find({ status: { $ne: 'inactive' } }).sort({ createdAt: 1 }).lean(), Salary.find({ month }).lean()]);
  const data = teachers.map((t) => ({ teacher: t, salary: rows.find((r) => String(r.teacher) === String(t._id)) || null }));
  return NextResponse.json({ data, month });
});

export const dynamic = 'force-dynamic';
