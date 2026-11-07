import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import StaffAttendance from '@/models/StaffAttendance';
import Staff from '@/models/Staff';

export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const date = sp.get('date') || new Date().toISOString().slice(0, 10);

  const [staffList, records] = await Promise.all([
    Staff.find({ status: { $ne: 'Inactive' } }).lean(),
    StaffAttendance.find({ date }).lean(),
  ]);

  const recordMap = Object.fromEntries(records.map((r) => [String(r.staff), r]));

  const data = staffList.map((s) => ({
    staff: s,
    record: recordMap[String(s._id)] || {
      status: s.status === 'On Leave' ? 'On Leave' : 'Present',
      checkIn: '09:00 AM',
      checkOut: '04:30 PM',
    },
  }));

  return NextResponse.json({ date, data });
});

export const POST = wrap(async (req) => {
  await connectDB();
  const { date, staffId, status, checkIn, checkOut } = await req.json();
  const record = await StaffAttendance.findOneAndUpdate(
    { staff: staffId, date },
    { status, checkIn, checkOut },
    { upsert: true, new: true }
  );
  return NextResponse.json(record);
});

export const dynamic = 'force-dynamic';

