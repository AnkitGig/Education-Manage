import { NextResponse } from 'next/server';
import { wrap, collection } from '@/lib/crud';
import Batch from '@/models/Batch';
import Student from '@/models/Student';

// ?course=&teacher=&day=Mon
export const GET = wrap(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = {};
  ['course', 'teacher', 'status'].forEach((k) => { if (sp.get(k)) q[k] = sp.get(k); });
  if (sp.get('day')) q.days = sp.get('day');
  const [batches, sc] = await Promise.all([
    Batch.find(q).sort({ createdAt: 1 }).populate('course', 'name').populate('teacher', 'name photo').lean(),
    Student.aggregate([{ $match: { status: { $ne: 'inactive' } } }, { $group: { _id: '$batch', n: { $sum: 1 } } }]),
  ]);
  const S = Object.fromEntries(sc.map((x) => [String(x._id), x.n]));
  return NextResponse.json({ data: batches.map((b) => ({ ...b, students: S[b._id] || 0 })) });
});
export const POST = collection(Batch).POST;

export const dynamic = 'force-dynamic';
