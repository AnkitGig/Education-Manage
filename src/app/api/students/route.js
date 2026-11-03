import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { esc, nextId, curMonth } from '@/lib/utils';
import Student from '@/models/Student';
import FeeRecord from '@/models/FeeRecord';

export const GET = wrap(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = {};
  ['course', 'batch', 'status'].forEach((k) => { const v = sp.get(k); if (v && v !== 'all') q[k] = v; });
  const s = sp.get('q');
  if (s) { const r = { $regex: esc(s), $options: 'i' }; q.$or = [{ name: r }, { mobile: r }, { parentMobile: r }, { studentId: r }]; }
  const page = +sp.get('page') || 1, limit = +sp.get('limit') || 8;

  const [data, total, st] = await Promise.all([
    Student.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('course', 'name').populate('batch', 'name').lean(),
    Student.countDocuments(q),
    Student.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const dues = await FeeRecord.aggregate([
    { $match: { student: { $in: data.map((d) => d._id) }, $expr: { $lt: ['$paid', '$amount'] } } },
    { $group: { _id: '$student', due: { $sum: { $subtract: ['$amount', '$paid'] } } } },
  ]);
  const dueMap = Object.fromEntries(dues.map((d) => [String(d._id), d.due]));
  const stats = { total: 0, active: 0, onhold: 0, inactive: 0 };
  st.forEach((x) => { stats[x._id] = x.n; stats.total += x.n; });

  return NextResponse.json({
    data: data.map((d) => ({ ...d, due: dueMap[String(d._id)] || 0 })),
    total, page, pages: Math.ceil(total / limit) || 1, stats,
  });
});

export const POST = wrap(async (req) => {
  const body = await req.json();
  if (!body.name || !body.parentName || !body.parentMobile || !body.course || !body.batch) return bad('Please fill all required fields');
  const student = await Student.create({ ...body, studentId: await nextId('student', 'STU', 4) });
  // first fee record is due 7 days after admission
  if (student.feeAmount > 0) {
    const adm = new Date(student.admissionDate);
    await FeeRecord.create({
      student: student._id, month: curMonth(adm), plan: student.feePlan, amount: student.feeAmount,
      dueDate: new Date(adm.getTime() + 7 * 864e5),
    });
  }
  return NextResponse.json(student, { status: 201 });
});

export const dynamic = 'force-dynamic';
