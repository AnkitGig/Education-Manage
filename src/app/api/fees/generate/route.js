import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth, PLAN_MONTHS } from '@/lib/utils';
import Student from '@/models/Student';
import FeeRecord from '@/models/FeeRecord';

const diff = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };

// Creates the fee records for a month (idempotent). Quarterly/half-yearly/yearly students get a new record only when their cycle is up.
export const POST = wrap(async (req) => {
  const { month = curMonth(), dueDay = 5 } = await req.json().catch(() => ({}));
  const [y, m] = month.split('-').map(Number);
  const students = await Student.find({ status: 'active', feeAmount: { $gt: 0 } }).lean();
  let created = 0;
  for (const s of students) {
    const last = await FeeRecord.findOne({ student: s._id }).sort({ month: -1 }).lean();
    if (last && diff(last.month, month) < (PLAN_MONTHS[s.feePlan] || 1)) continue;
    await FeeRecord.create({ student: s._id, month, plan: s.feePlan, amount: s.feeAmount, dueDate: new Date(y, m - 1, dueDay) });
    created++;
  }
  return NextResponse.json({ created });
});

export const dynamic = 'force-dynamic';
