import { NextResponse } from 'next/server';
import { wrap, collection } from '@/lib/crud';
import { esc, nextId } from '@/lib/utils';
import Teacher from '@/models/Teacher';
import Batch from '@/models/Batch';

export const GET = wrap(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = {};
  if (sp.get('status') && sp.get('status') !== 'all') q.status = sp.get('status');
  if (sp.get('subject') && sp.get('subject') !== 'all') q.subjects = sp.get('subject');
  if (sp.get('q')) { const r = { $regex: esc(sp.get('q')), $options: 'i' }; q.$or = [{ name: r }, { phone: r }, { subjects: r }]; }
  const page = +sp.get('page') || 1, limit = +sp.get('limit') || 10;
  const all = sp.get('all') === '1';
  let cur = Teacher.find(q).sort({ createdAt: 1 });
  if (!all) cur = cur.skip((page - 1) * limit).limit(limit);
  const [data, total, st, bc, subj] = await Promise.all([
    cur.lean(), Teacher.countDocuments(q),
    Teacher.aggregate([{ $group: { _id: '$status', n: { $sum: 1 }, sal: { $sum: '$salary' } } }]),
    Batch.aggregate([{ $group: { _id: '$teacher', n: { $sum: 1 } } }]),
    Teacher.distinct('subjects'),
  ]);
  const B = Object.fromEntries(bc.map((x) => [String(x._id), x.n]));
  const stats = { total: 0, active: 0, onleave: 0, inactive: 0, monthlySalary: 0 };
  st.forEach((x) => { stats[x._id] = x.n; stats.total += x.n; if (x._id !== 'inactive') stats.monthlySalary += x.sal; });
  return NextResponse.json({ data: data.map((t) => ({ ...t, batches: B[t._id] || 0 })), total, pages: Math.ceil(total / limit) || 1, stats, subjects: subj });
});
export const POST = collection(Teacher, { beforeCreate: async (b) => ({ ...b, teacherId: await nextId('teacher', 'TCH', 3) }) }).POST;

export const dynamic = 'force-dynamic';
