import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { esc, nextId, curMonth } from '@/lib/utils';
import Student from '@/models/Student';
import FeeRecord from '@/models/FeeRecord';
import Batch from '@/models/Batch';
import FeeStructure from '@/models/FeeStructure';

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
  if (!body.name || !body.parentName || !body.parentMobile || !body.course || !body.batch) {
    return bad('Please fill all required fields');
  }

  // Look up matching Fee Structure created for this class & section
  const batch = await Batch.findById(body.batch).lean();
  let feeStructure = null;
  if (body.feeStructureId) {
    feeStructure = await FeeStructure.findById(body.feeStructureId).lean();
  }
  if (!feeStructure && batch) {
    feeStructure = await FeeStructure.findOne({
      course: body.course,
      section: batch.name,
      isActive: { $ne: false },
    }).lean();
  }
  if (!feeStructure) {
    feeStructure = await FeeStructure.findOne({
      course: body.course,
      section: { $in: ['All', '', null] },
      isActive: { $ne: false },
    }).lean();
  }
  if (!feeStructure) {
    feeStructure = await FeeStructure.findOne({
      course: body.course,
      isActive: { $ne: false },
    }).sort({ createdAt: -1 }).lean();
  }

  const feeAmount = feeStructure ? feeStructure.total : Number(body.feeAmount) || 0;
  const feePlan = feeStructure ? (feeStructure.frequency || 'yearly') : (body.feePlan || 'yearly');

  const student = await Student.create({
    ...body,
    feeAmount,
    feePlan,
    studentId: await nextId('student', 'STU', 4),
  });

  const adm = new Date(student.admissionDate);

  // If the fee structure defines installments, generate a record for each installment
  if (feeStructure?.enableInstallments && Array.isArray(feeStructure.installments) && feeStructure.installments.length > 0) {
    for (const inst of feeStructure.installments) {
      const dueDate = inst.dueDate ? new Date(inst.dueDate) : new Date(adm.getTime() + 7 * 864e5);
      await FeeRecord.create({
        student: student._id,
        month: curMonth(dueDate),
        plan: inst.name || 'Installment',
        amount: Number(inst.amount) || 0,
        dueDate,
      });
    }
  } else if (feeAmount > 0) {
    // Single fee record
    await FeeRecord.create({
      student: student._id,
      month: curMonth(adm),
      plan: feePlan,
      amount: feeAmount,
      dueDate: new Date(adm.getTime() + 7 * 864e5),
    });
  }

  return NextResponse.json(student, { status: 201 });
});

export const dynamic = 'force-dynamic';
