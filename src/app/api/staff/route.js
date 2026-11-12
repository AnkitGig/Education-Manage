import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { esc, nextId } from '@/lib/utils';
import { connectDB } from '@/lib/db';
import Staff from '@/models/Staff';
import StaffAttendance from '@/models/StaffAttendance';
import StaffLeave from '@/models/StaffLeave';

export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const q = {};

  const type = sp.get('type');
  if (type && type !== 'all') q.type = type;

  const department = sp.get('department');
  if (department && department !== 'all') q.department = department;

  const status = sp.get('status');
  if (status && status !== 'all') q.status = status;

  const assignedClass = sp.get('class');
  if (assignedClass && assignedClass !== 'all') q.assignedClasses = assignedClass;

  const search = sp.get('q');
  if (search) {
    const r = { $regex: esc(search), $options: 'i' };
    q.$or = [{ name: r }, { staffId: r }, { phone: r }, { subjects: r }, { role: r }];
  }

  const page = +sp.get('page') || 1;
  const limit = +sp.get('limit') || 10;
  const all = sp.get('all') === '1';

  let cur = Staff.find(q).sort({ createdAt: 1 });
  if (!all) cur = cur.skip((page - 1) * limit).limit(limit);

  const todayStr = new Date().toISOString().slice(0, 10);

  const [data, total, allStaff, todayAtt, activeLeaves] = await Promise.all([
    cur.lean(),
    Staff.countDocuments(q),
    Staff.find({}).lean(),
    StaffAttendance.find({ date: todayStr }).lean(),
    StaffLeave.find({ status: 'Approved' }).lean(),
  ]);

  const totalStaff = allStaff.length;
  const teachersCount = allStaff.filter((s) => s.type === 'Teaching').length;
  const nonTeachingCount = allStaff.filter((s) => s.type === 'Non-Teaching').length;
  const onLeaveCount = allStaff.filter((s) => s.status === 'On Leave').length;
  const presentTodayCount = todayAtt.filter((a) => a.status === 'Present').length || (totalStaff - onLeaveCount);

  const departments = [...new Set(allStaff.map((s) => s.department).filter(Boolean))];
  const classesList = [...new Set(allStaff.flatMap((s) => s.assignedClasses || []).filter(Boolean))];

  return NextResponse.json({
    data,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    stats: {
      totalStaff,
      teachersCount,
      nonTeachingCount,
      presentToday: presentTodayCount,
      onLeave: onLeaveCount,
    },
    meta: {
      departments,
      classes: classesList,
    },
  });
});

export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json();
  const prefix = body.type === 'Non-Teaching' ? 'STF' : 'TCH';
  const staffId = await nextId('staff', prefix, 3);
  const created = await Staff.create({ ...body, staffId });
  return NextResponse.json(created, { status: 201 });
});

export const dynamic = 'force-dynamic';

