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

  // Extract all payment logs grouped by receipt / transaction, sorted newest first
  const paymentsByReceipt = {};
  recs.forEach((r) => {
    (r.payments || []).forEach((p) => {
      // Group by receipt number if present, otherwise fallback to payment _id
      const key = p.receiptNo || String(p._id);
      if (!paymentsByReceipt[key]) {
        paymentsByReceipt[key] = {
          _id: p._id,
          receiptNo: p.receiptNo || '–',
          amount: 0,
          mode: p.mode || 'Cash',
          date: p.date || r.updatedAt || r.createdAt,
          note: p.note || '',
          plans: [],
          months: [],
          feeRecordIds: [],
        };
      }
      paymentsByReceipt[key].amount += Number(p.amount || 0);
      if (r.plan && !paymentsByReceipt[key].plans.includes(r.plan)) {
        paymentsByReceipt[key].plans.push(r.plan);
      }
      if (r.month && !paymentsByReceipt[key].months.includes(r.month)) {
        paymentsByReceipt[key].months.push(r.month);
      }
      if (r._id && !paymentsByReceipt[key].feeRecordIds.includes(String(r._id))) {
        paymentsByReceipt[key].feeRecordIds.push(String(r._id));
      }
      // If any item has a newer date/timestamp, keep the most accurate date
      if (p.date && (!paymentsByReceipt[key].date || new Date(p.date) > new Date(paymentsByReceipt[key].date))) {
        paymentsByReceipt[key].date = p.date;
      }
    });
  });

  const allPayments = Object.values(paymentsByReceipt).map((p) => {
    let planLabel = 'Fee Payment';
    if (p.plans.length === 1) {
      planLabel = p.plans[0];
    } else if (p.plans.length > 1) {
      planLabel = `${p.plans[0]} – ${p.plans[p.plans.length - 1]} (${p.plans.length} Installments)`;
    }

    let monthLabel = '';
    if (p.months.length === 1) {
      monthLabel = p.months[0];
    } else if (p.months.length > 1) {
      monthLabel = `${p.months[0]} to ${p.months[p.months.length - 1]}`;
    }

    return {
      _id: p._id,
      receiptNo: p.receiptNo,
      amount: p.amount,
      mode: p.mode,
      date: p.date,
      note: p.note,
      plan: planLabel,
      month: monthLabel,
      installmentsCount: p.plans.length,
    };
  });

  allPayments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return NextResponse.json({
    fees: {
      total,
      paid,
      due: total - paid,
      nextDue: next?.dueDate || null,
      paidTill: lastPaid?.month || null,
      records: recs.map((r) => ({ ...r, status: feeStatus(r) })),
    },
    paymentLogs: allPayments,
    attendance: { ...c, total: days, percent: days ? Math.round(((c.present + c.late) / days) * 100) : 0 },
  });
});

export const dynamic = 'force-dynamic';
