import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { nextId } from '@/lib/utils';
import { sendText, fill } from '@/lib/whatsapp';
import FeeRecord from '@/models/FeeRecord';
import Student from '@/models/Student';
import Institute from '@/models/Institute';
import Template from '@/models/Template';
import { DEFAULT_TEMPLATES } from '@/lib/templates';

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
  const total = left;
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

  // payment confirmation over WhatsApp (if automation is on)
  const inst = await Institute.findOne().lean();
  if (inst?.automation?.paymentConfirmation !== false) {
    const s = await Student.findById(student).lean();
    const t = (await Template.findOne({ key: 'payment' }).lean()) || DEFAULT_TEMPLATES.find((x) => x.key === 'payment');
    sendText(s.parentMobile, fill(t.body, { parent: s.parentName, student: s.name, amount: total, receipt: receiptNo, institute: inst?.name || '' })).catch(() => {});
  }
  return NextResponse.json({ ok: true, receiptNo });
});

export const dynamic = 'force-dynamic';
