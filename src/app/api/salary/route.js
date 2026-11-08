import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import { curMonth } from '@/lib/utils';
import Staff from '@/models/Staff';
import Salary from '@/models/Salary';

// GET /api/salary?month=YYYY-MM&type=Teaching|Non-Teaching|all&q=
export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const month = sp.get('month') || curMonth();
  const type = sp.get('type');
  const q = (sp.get('q') || '').toLowerCase().trim();

  // If querying salary history of one specific staff member
  if (sp.get('staff')) {
    const data = await Salary.find({ staff: sp.get('staff') })
      .populate('staff', 'name staffId role department type')
      .sort({ month: -1 })
      .lean();
    return NextResponse.json({ data });
  }

  // Find all active / eligible staff members
  const staffFilter = { status: { $ne: 'Inactive' } };
  if (type && type !== 'all') staffFilter.type = type;

  const [staffList, salaryRows] = await Promise.all([
    Staff.find(staffFilter).sort({ type: 1, name: 1 }).lean(),
    Salary.find({ month }).lean(),
  ]);

  const salaryMap = Object.fromEntries(salaryRows.map((r) => [String(r.staff), r]));

  let data = staffList.map((s) => {
    const sal = salaryMap[String(s._id)] || null;
    return {
      staff: s,
      salary: sal,
      baseSalary: s.salary || 0,
      netSalary: sal ? sal.netAmount : s.salary || 0,
      status: sal ? sal.status : 'not_generated',
      paidOn: sal?.paidOn || null,
      paymentMode: sal?.paymentMode || 'Bank Transfer',
    };
  });

  if (q) {
    data = data.filter(
      (r) =>
        r.staff.name.toLowerCase().includes(q) ||
        (r.staff.staffId && r.staff.staffId.toLowerCase().includes(q)) ||
        (r.staff.department && r.staff.department.toLowerCase().includes(q)) ||
        (r.staff.role && r.staff.role.toLowerCase().includes(q))
    );
  }

  // Summary counts for this month
  const totalStaff = data.length;
  const paidCount = data.filter((r) => r.status === 'paid').length;
  const pendingCount = totalStaff - paidCount;
  const totalPayroll = data.reduce((sum, r) => sum + (r.netSalary || 0), 0);
  const paidAmount = data
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + (r.netSalary || 0), 0);
  const pendingAmount = totalPayroll - paidAmount;

  return NextResponse.json({
    data,
    month,
    stats: {
      totalStaff,
      paidCount,
      pendingCount,
      totalPayroll,
      paidAmount,
      pendingAmount,
    },
  });
});

export const dynamic = 'force-dynamic';
