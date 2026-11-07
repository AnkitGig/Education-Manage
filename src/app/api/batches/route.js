import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Batch from '@/models/Batch';
import Staff from '@/models/Staff';
import Course from '@/models/Course';
import Student from '@/models/Student';

// Helper to keep Staff.assignedClasses in sync with Batches
async function syncStaffAssignedClasses(staffId) {
  if (!staffId) return;
  try {
    const assignedBatches = await Batch.find({ teacher: staffId }).populate('course', 'name').lean();
    const classList = assignedBatches.map((b) => {
      const cName = b.course?.name || '';
      return cName ? `${cName} - ${b.name}` : b.name;
    });
    await Staff.findByIdAndUpdate(staffId, { assignedClasses: classList });
  } catch (err) {
    console.error('Error syncing staff assigned classes:', err);
  }
}

// GET /api/batches?course=&teacher=&day=&status=
export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const q = {};
  ['course', 'teacher', 'status'].forEach((k) => {
    if (sp.get(k)) q[k] = sp.get(k);
  });
  if (sp.get('day')) q.days = sp.get('day');

  const [batches, sc] = await Promise.all([
    Batch.find(q)
      .sort({ createdAt: 1 })
      .populate('course', 'name board')
      .populate('teacher', 'name staffId role photo phone email')
      .lean(),
    Student.aggregate([
      { $match: { status: { $ne: 'inactive' } } },
      { $group: { _id: '$batch', n: { $sum: 1 } } },
    ]),
  ]);

  const S = Object.fromEntries(sc.map((x) => [String(x._id), x.n]));
  return NextResponse.json({
    data: batches.map((b) => ({ ...b, students: S[b._id] || 0 })),
  });
});

// POST /api/batches
export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json();
  const batch = await Batch.create(body);
  if (batch.teacher) {
    await syncStaffAssignedClasses(batch.teacher);
  }
  return NextResponse.json(batch, { status: 201 });
});

export const dynamic = 'force-dynamic';
