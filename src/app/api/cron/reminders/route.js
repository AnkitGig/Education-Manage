import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendBulk, fill } from '@/lib/whatsapp';
import { DEFAULT_TEMPLATES } from '@/lib/templates';
import FeeRecord from '@/models/FeeRecord';
import Institute from '@/models/Institute';
import Template from '@/models/Template';

// Call daily (Vercel Cron / any scheduler):  GET /api/cron/reminders?secret=CRON_SECRET
// Sends fee reminders for dues falling exactly 3 days from today.
export async function GET(req) {
  const secret = new URL(req.url).searchParams.get('secret') || req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  const inst = await Institute.findOne().lean();
  if (inst?.automation?.feeReminder === false) return NextResponse.json({ skipped: true });
  const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(0, 0, 0, 0);
  const e = new Date(d); e.setDate(e.getDate() + 1);
  const recs = await FeeRecord.find({ dueDate: { $gte: d, $lt: e }, $expr: { $lt: ['$paid', '$amount'] } })
    .populate({ path: 'student', populate: [{ path: 'course', select: 'name' }, { path: 'batch', select: 'name' }] }).lean();
  const t = (await Template.findOne({ key: 'fee_due' }).lean()) || DEFAULT_TEMPLATES[0];
  const items = recs.filter((r) => r.student).map((r) => ({
    to: r.student.parentMobile,
    text: fill(t.body, { parent: r.student.parentName, student: r.student.name, course: r.student.course?.name, batch: r.student.batch?.name, amount: r.amount - r.paid, dueDate: new Date(r.dueDate).toLocaleDateString('en-IN'), institute: inst?.name || '' }),
  }));
  const res = items.length ? await sendBulk({ title: 'Fee reminder – auto', template: 'fee_due', items }) : { sent: 0 };
  return NextResponse.json(res);
}

export const dynamic = 'force-dynamic';
