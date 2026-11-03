import { NextResponse } from 'next/server';
import { wrap, collection } from '@/lib/crud';
import Course from '@/models/Course';
import Student from '@/models/Student';
import Batch from '@/models/Batch';

export const GET = wrap(async () => {
  const [courses, sc, bc] = await Promise.all([
    Course.find().sort({ createdAt: 1 }).lean(),
    Student.aggregate([{ $match: { status: { $ne: 'inactive' } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
    Batch.aggregate([{ $group: { _id: '$course', n: { $sum: 1 } } }]),
  ]);
  const S = Object.fromEntries(sc.map((x) => [String(x._id), x.n]));
  const B = Object.fromEntries(bc.map((x) => [String(x._id), x.n]));
  return NextResponse.json({ data: courses.map((c) => ({ ...c, students: S[c._id] || 0, batches: B[c._id] || 0 })) });
});
export const POST = collection(Course).POST;

export const dynamic = 'force-dynamic';
