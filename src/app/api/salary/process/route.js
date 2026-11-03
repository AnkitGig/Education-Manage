import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth } from '@/lib/utils';
import Teacher from '@/models/Teacher';
import Salary from '@/models/Salary';

// { month, payTeacher? } – creates payroll rows for all active teachers; optionally marks one teacher as paid
export const POST = wrap(async (req) => {
  const { month = curMonth(), payTeacher } = await req.json().catch(() => ({}));
  const teachers = await Teacher.find({ status: 'active' }).lean();
  if (teachers.length)
    await Salary.bulkWrite(teachers.map((t) => ({
      updateOne: { filter: { teacher: t._id, month }, update: { $setOnInsert: { teacher: t._id, month, amount: t.salary, status: 'pending' } }, upsert: true },
    })));
  if (payTeacher) await Salary.updateOne({ teacher: payTeacher, month }, { status: 'paid', paidOn: new Date() });
  return NextResponse.json({ ok: true, count: teachers.length });
});

export const dynamic = 'force-dynamic';
