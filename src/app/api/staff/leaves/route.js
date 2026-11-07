import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import StaffLeave from '@/models/StaffLeave';
import Staff from '@/models/Staff';

export const GET = wrap(async () => {
  await connectDB();
  const count = await StaffLeave.countDocuments();
  if (count === 0) {
    const kavita = await Staff.findOne({ name: 'Kavita Joshi' });
    if (kavita) {
      await StaffLeave.create({
        staff: kavita._id,
        leaveType: 'Casual Leave',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10),
        days: 3,
        reason: 'Family function in hometown',
        status: 'Approved',
        reviewedBy: 'Admin',
      });
    }
  }

  const leaves = await StaffLeave.find().populate('staff').sort({ createdAt: -1 }).lean();
  return NextResponse.json(leaves);
});

export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json();
  const created = await StaffLeave.create(body);
  if (body.status === 'Approved') {
    await Staff.findByIdAndUpdate(body.staff, { status: 'On Leave' });
  }
  return NextResponse.json(created, { status: 201 });
});

export const dynamic = 'force-dynamic';

