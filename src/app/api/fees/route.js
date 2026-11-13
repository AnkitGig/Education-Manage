import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { esc, feeStatus } from '@/lib/utils';
import FeeRecord from '@/models/FeeRecord';
import Student from '@/models/Student';
import { syncAllMissingFeeRecords } from '@/lib/feeRecords';

export const GET = wrap(async (req) => {
  await syncAllMissingFeeRecords();
  const sp = new URL(req.url).searchParams;
  const page = +sp.get('page') || 1, limit = +sp.get('limit') || 10;
  const statusFilter = sp.get('status'); // 'all', 'paid', 'due', 'partial'
  const course = sp.get('course');
  const batch = sp.get('batch');
  const q = (sp.get('q') || '').toLowerCase().trim();

  // Find targeted students
  const studentQuery = {};
  if (course && course !== 'all') studentQuery.course = course;
  if (batch && batch !== 'all') studentQuery.batch = batch;
  if (q) {
    const r = { $regex: esc(q), $options: 'i' };
    studentQuery.$or = [{ name: r }, { mobile: r }, { parentMobile: r }, { studentId: r }];
  }

  const students = await Student.find(studentQuery)
    .populate('course', 'name')
    .populate('batch', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = students.map((s) => s._id);

  // Fetch all fee records for these students
  const feeRecords = await FeeRecord.find({ student: { $in: studentIds } })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();

  const recordMap = {};
  feeRecords.forEach((r) => {
    const sid = String(r.student);
    if (!recordMap[sid]) recordMap[sid] = [];
    const due = Math.max(0, (r.amount || 0) - (r.paid || 0));

    // Extract last payment info
    const lastPayment = Array.isArray(r.payments) && r.payments.length > 0
      ? r.payments[r.payments.length - 1]
      : null;
    const paidAt = lastPayment?.date || (r.paid > 0 ? (r.updatedAt || r.createdAt) : null);
    const paidMode = lastPayment?.mode || null;
    const receiptNo = lastPayment?.receiptNo || null;

    recordMap[sid].push({
      _id: r._id,
      plan: r.plan,
      month: r.month,
      amount: Number(r.amount || 0),
      paid: Number(r.paid || 0),
      due,
      dueDate: r.dueDate,
      status: feeStatus(r),
      paidAt,
      paidMode,
      receiptNo,
      payments: r.payments || [],
    });
  });

  let summaries = students.map((s) => {
    const sRecords = (recordMap[String(s._id)] || []).sort(
      (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
    );
    const total = sRecords.reduce((sum, r) => sum + r.amount, 0) || (s.feeAmount || 0);
    const paid = sRecords.reduce((sum, r) => sum + r.paid, 0);
    const due = Math.max(0, total - paid);

    let status = 'due';
    if (total > 0 && due === 0) {
      status = 'paid';
    } else if (paid > 0 && due > 0) {
      status = 'partial';
    }

    const nextPending = sRecords.find((r) => r.due > 0);

    return {
      _id: s._id,
      student: s,
      amount: total,
      paid,
      due,
      status,
      installments: sRecords,
      nextPendingInstallment: nextPending || null,
      totalInstallments: sRecords.length,
      paidInstallmentsCount: sRecords.filter((r) => r.status === 'paid').length,
    };
  });

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'due') {
      summaries = summaries.filter((s) => s.status === 'due' || s.status === 'partial');
    } else if (statusFilter === 'paid') {
      summaries = summaries.filter((s) => s.status === 'paid');
    } else if (statusFilter === 'partial') {
      summaries = summaries.filter((s) => s.status === 'partial');
    }
  }

  const totalFee = summaries.reduce((s, r) => s + r.amount, 0);
  const collectedFee = summaries.reduce((s, r) => s + r.paid, 0);
  const stats = {
    total: totalFee,
    collected: collectedFee,
    pending: Math.max(0, totalFee - collectedFee),
    paidStudents: summaries.filter((r) => r.status === 'paid').length,
    students: summaries.length,
  };

  return NextResponse.json({
    data: summaries.slice((page - 1) * limit, page * limit),
    total: summaries.length,
    pages: Math.ceil(summaries.length / limit) || 1,
    stats,
  });
});

export const dynamic = 'force-dynamic';
