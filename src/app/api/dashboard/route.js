import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth, lastMonths } from '@/lib/utils';
import { monthFinance } from '@/lib/finance';
import Student from '@/models/Student';
import FeeRecord from '@/models/FeeRecord';
import Batch from '@/models/Batch';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const GET = wrap(async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = lastMonths(10);

  const [total, thisMonth, fin, pend, batches, sc, growth, recentStudents, dues] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ createdAt: { $gte: monthStart } }),
    monthFinance(curMonth()),
    FeeRecord.aggregate([{ $match: { $expr: { $lt: ['$paid', '$amount'] } } }, { $group: { _id: null, amt: { $sum: { $subtract: ['$amount', '$paid'] } }, students: { $addToSet: '$student' } } }]),
    Batch.find({ status: 'active', days: DAYS[now.getDay()] }).populate('course', 'name').lean(),
    Student.aggregate([{ $match: { status: { $ne: 'inactive' } } }, { $group: { _id: '$batch', n: { $sum: 1 } } }]),
    Promise.all(months.map((m) => { const [y, mo] = m.split('-').map(Number); return Student.countDocuments({ createdAt: { $lt: new Date(y, mo, 1) } }).then((count) => ({ m: new Date(y, mo - 1, 1).toLocaleString('en-IN', { month: 'short' }), count })); })),
    Student.find().sort({ createdAt: -1 }).limit(5).populate('course', 'name').populate('batch', 'name').lean(),
    FeeRecord.find({ $expr: { $lt: ['$paid', '$amount'] } }).sort({ dueDate: 1 }).limit(5).populate('student', 'name studentId parentMobile').lean(),
  ]);

  const S = Object.fromEntries(sc.map((x) => [String(x._id), x.n]));
  const hhmm = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };

  return NextResponse.json({
    totalStudents: total, studentsThisMonth: thisMonth,
    feesCollected: fin.income, feesPending: pend[0]?.amt || 0, pendingStudents: pend[0]?.students.length || 0,
    classes: batches.sort((a, b) => toMin(a.startTime) - toMin(b.startTime)).map((b) => ({
      _id: b._id, name: `${b.course?.name || ''} – ${b.name}`, room: b.room, time: hhmm(b.startTime), students: S[b._id] || 0,
      state: nowMin >= toMin(b.endTime) ? 'completed' : nowMin >= toMin(b.startTime) ? 'ongoing' : 'upcoming',
    })),
    growth, recentStudents, dueReminders: dues.filter((d) => d.student),
  });
});

export const dynamic = 'force-dynamic';
