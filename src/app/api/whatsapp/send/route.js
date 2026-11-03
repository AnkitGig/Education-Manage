import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { sendBulk, fill } from '@/lib/whatsapp';
import { DEFAULT_TEMPLATES } from '@/lib/templates';
import { dayKey } from '@/lib/utils';
import Student from '@/models/Student';
import FeeRecord from '@/models/FeeRecord';
import Institute from '@/models/Institute';
import Template from '@/models/Template';

// { scope: student|batch|course|all, student, batch, course, template:key, message? }
export const POST = wrap(async (req) => {
  const { scope, student, batch, course, template, message } = await req.json();
  const q = { status: 'active' };
  if (scope === 'student') { if (!student) return bad('Select a student'); q._id = student; }
  else if (scope === 'batch') { if (!batch) return bad('Select a batch'); q.batch = batch; }
  else if (scope === 'course') { if (!course) return bad('Select a course'); q.course = course; }
  else if (scope !== 'all') return bad('Invalid scope');

  const [students, inst, tpl] = await Promise.all([
    Student.find(q).populate('course', 'name').populate('batch', 'name').lean(),
    Institute.findOne().lean(),
    Template.findOne({ key: template }).lean(),
  ]);
  const t = tpl || DEFAULT_TEMPLATES.find((x) => x.key === template);
  if (!t) return bad('Template not found');
  if (!students.length) return bad('No active students found for this selection');

  const fees = await FeeRecord.find({ student: { $in: students.map((s) => s._id) }, $expr: { $lt: ['$paid', '$amount'] } }).sort({ dueDate: 1 }).lean();
  const firstDue = {};
  fees.forEach((f) => { if (!firstDue[f.student]) firstDue[f.student] = f; });

  const items = students.map((s) => {
    const f = firstDue[s._id];
    return {
      to: s.parentMobile,
      text: fill(t.body, {
        parent: s.parentName, student: s.name, course: s.course?.name, batch: s.batch?.name,
        amount: f ? f.amount - f.paid : s.feeAmount, dueDate: f ? new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        date: dayKey(), message: message || '', institute: inst?.name || '',
      }),
    };
  });
  return NextResponse.json(await sendBulk({ title: `${t.title} – ${scope}`, template: t.key, items }));
});

export const dynamic = 'force-dynamic';
