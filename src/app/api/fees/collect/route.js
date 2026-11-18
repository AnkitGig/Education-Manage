import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { nextId } from '@/lib/utils';
import FeeRecord from '@/models/FeeRecord';

// { student, amount, mode }  – pays oldest dues first
export const POST = wrap(async (req) => {
  const { student, amount, mode = 'Cash', note } = await req.json();
  let left = Number(amount);
  if (!student || !(left > 0)) return bad('Select a student and enter an amount');
  const recs = await FeeRecord.find({ student }).sort({ dueDate: 1 });
  const outstanding = recs.reduce((s, r) => s + (r.amount - r.paid), 0);
  if (outstanding <= 0) return bad('This student has no outstanding fees');
  if (left > outstanding) return bad(`Amount is more than the outstanding ₹${outstanding}`);

  const receiptNo = await nextId('receipt', 'RCP', 5);
  for (const r of recs) {
    if (left <= 0) break;
    const due = r.amount - r.paid;
    if (due <= 0) continue;
    const pay = Math.min(due, left);
    r.paid += pay;
    r.payments.push({ amount: pay, mode, date: new Date(), receiptNo, note });
    await r.save();
    left -= pay;
  }

  return NextResponse.json({ ok: true, receiptNo });
});

export const dynamic = 'force-dynamic';
