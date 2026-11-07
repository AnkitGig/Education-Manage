import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { esc, nextId } from '@/lib/utils';
import { connectDB } from '@/lib/db';
import Staff from '@/models/Staff';
import StaffAttendance from '@/models/StaffAttendance';
import StaffLeave from '@/models/StaffLeave';

const SEED_STAFF = [
  { name: 'Neha Sharma', type: 'Teaching', role: 'Teacher', department: 'Academics', subjects: ['Mathematics'], assignedClasses: ['Class 8 A', 'Class 8 B'], phone: '+91 98765 43210', email: 'neha.sharma@example.com', salary: 35000, status: 'Active' },
  { name: 'Rohit Verma', type: 'Teaching', role: 'Teacher', department: 'Academics', subjects: ['Science'], assignedClasses: ['Class 9 A'], phone: '+91 87654 32109', email: 'rohit.verma@example.com', salary: 38000, status: 'Active' },
  { name: 'Priya Patel', type: 'Teaching', role: 'Teacher', department: 'Academics', subjects: ['English'], assignedClasses: ['Class 7 A', 'Class 7 B'], phone: '+91 99887 66554', email: 'priya.patel@example.com', salary: 32000, status: 'Active' },
  { name: 'Amit Singh', type: 'Teaching', role: 'Teacher', department: 'Academics', subjects: ['Social Studies'], assignedClasses: ['Class 10 A'], phone: '+91 90123 45678', email: 'amit.singh@example.com', salary: 40000, status: 'Active' },
  { name: 'Kavita Joshi', type: 'Teaching', role: 'Teacher', department: 'Academics', subjects: ['Hindi'], assignedClasses: ['Class 6 A', 'Class 6 B'], phone: '+91 94728 33011', email: 'kavita.joshi@example.com', salary: 30000, status: 'On Leave' },
  { name: 'Ramesh Gupta', type: 'Non-Teaching', role: 'Accountant', department: 'Finance', subjects: [], assignedClasses: [], phone: '+91 98112 33445', email: 'ramesh.gupta@example.com', salary: 28000, status: 'Active' },
  { name: 'Suman Roy', type: 'Non-Teaching', role: 'Librarian', department: 'Library', subjects: [], assignedClasses: [], phone: '+91 97234 55667', email: 'suman.roy@example.com', salary: 24000, status: 'Active' },
  { name: 'Sunil Kumar', type: 'Non-Teaching', role: 'Lab Assistant', department: 'Operations', subjects: [], assignedClasses: [], phone: '+91 96321 88990', email: 'sunil.kumar@example.com', salary: 20000, status: 'Active' },
  { name: 'Mahesh Yadav', type: 'Non-Teaching', role: 'Admin Staff', department: 'Administration', subjects: [], assignedClasses: [], phone: '+91 95432 11223', email: 'mahesh.yadav@example.com', salary: 22000, status: 'Active' },
  { name: 'Pooja Verma', type: 'Teaching', role: 'Senior Teacher', department: 'Academics', subjects: ['Physics'], assignedClasses: ['Class 11 A', 'Class 12 A'], phone: '+91 91234 56780', email: 'pooja.verma@example.com', salary: 45000, status: 'Active' },
];

export const GET = wrap(async (req) => {
  await connectDB();
  const count = await Staff.countDocuments();
  if (count === 0) {
    for (let i = 0; i < SEED_STAFF.length; i++) {
      const s = SEED_STAFF[i];
      const prefix = s.type === 'Teaching' ? 'TCH' : 'STF';
      const staffId = await nextId('staff', prefix, 3);
      await Staff.create({ ...s, staffId });
    }
  }

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

