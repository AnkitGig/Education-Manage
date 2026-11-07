import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Batch from '@/models/Batch';
import Staff from '@/models/Staff';

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

export const GET = wrap(async (req, { params }) => {
  await connectDB();
  const batch = await Batch.findById(params.id)
    .populate('course', 'name')
    .populate('teacher', 'name staffId role photo')
    .lean();
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(batch);
});

export const PUT = wrap(async (req, { params }) => {
  await connectDB();
  const body = await req.json();
  const oldBatch = await Batch.findById(params.id).lean();
  const updated = await Batch.findByIdAndUpdate(params.id, body, { new: true });

  // Sync previous teacher and new teacher
  if (oldBatch?.teacher && String(oldBatch.teacher) !== String(updated?.teacher)) {
    await syncStaffAssignedClasses(oldBatch.teacher);
  }
  if (updated?.teacher) {
    await syncStaffAssignedClasses(updated.teacher);
  }

  return NextResponse.json(updated);
});

export const DELETE = wrap(async (req, { params }) => {
  await connectDB();
  const oldBatch = await Batch.findById(params.id).lean();
  await Batch.findByIdAndDelete(params.id);
  if (oldBatch?.teacher) {
    await syncStaffAssignedClasses(oldBatch.teacher);
  }
  return NextResponse.json({ success: true });
});

export const dynamic = 'force-dynamic';
