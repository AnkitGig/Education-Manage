import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Staff from '@/models/Staff';
import StaffAttendance from '@/models/StaffAttendance';
import StaffLeave from '@/models/StaffLeave';

export const GET = wrap(async (req, { params }) => {
  await connectDB();
  const staff = await Staff.findById(params.id).lean();
  if (!staff) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

  const [attendance, leaves] = await Promise.all([
    StaffAttendance.find({ staff: params.id }).sort({ date: -1 }).limit(30).lean(),
    StaffLeave.find({ staff: params.id }).sort({ createdAt: -1 }).lean(),
  ]);

  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = attendance.filter((a) => a.status === 'Absent').length;
  const halfDayCount = attendance.filter((a) => a.status === 'Half Day').length;
  const totalDays = attendance.length || 1;
  const percent = Math.round((presentCount / totalDays) * 100);

  return NextResponse.json({
    ...staff,
    attendanceHistory: attendance,
    leaveHistory: leaves,
    attendanceStats: {
      present: presentCount,
      absent: absentCount,
      halfDay: halfDayCount,
      total: attendance.length,
      percent: attendance.length ? percent : 95,
    },
  });
});

export const PUT = wrap(async (req, { params }) => {
  await connectDB();
  const body = await req.json();
  const updated = await Staff.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(updated);
});

export const DELETE = wrap(async (req, { params }) => {
  await connectDB();
  await Staff.findByIdAndDelete(params.id);
  await StaffAttendance.deleteMany({ staff: params.id });
  await StaffLeave.deleteMany({ staff: params.id });
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';

