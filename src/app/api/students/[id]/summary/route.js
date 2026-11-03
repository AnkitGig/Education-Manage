import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth, feeStatus } from '@/lib/utils';
import FeeRecord from '@/models/FeeRecord';
import Attendance from '@/models/Attendance';

// Fee + attendance summary for one student (used by profile panels)
export const GET = wrap(async (_, { params }) => {
  const id = params.id;
  const [recs, att] = await Promise.all([
    FeeRecord.find({ student: id }).sort({ dueDate: 1 }).lean(),
    Attendance.find({ date: { $regex: `^${curMonth()}` }, 'records.student': id }).lean(),
  ]);
  const total = recs.reduce((s, r) => s + r.amount, 0);
  const paid = recs.reduce((s, r) => s + r.paid, 0);
  const next = recs.find((r) => r.paid < r.amount);
  const lastPaid = [...recs].reverse().find((r) => r.paid > 0);
  const c = { present: 0, absent: 0, late: 0 };
  att.forEach((a) => { const r = a.records.find((x) => String(x.student) === id); if (r) c[r.status]++; });
  const days = c.present + c.absent + c.late;
  return NextResponse.json({
    fees: { total, paid, due: total - paid, nextDue: next?.dueDate || null, paidTill: lastPaid?.month || null,
      records: recs.map((r) => ({ ...r, status: feeStatus(r) })) },
    attendance: { ...c, total: days, percent: days ? Math.round(((c.present + c.late) / days) * 100) : 0 },
  });
});

export const dynamic = 'force-dynamic';
