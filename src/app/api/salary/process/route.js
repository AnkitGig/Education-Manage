import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import { curMonth } from '@/lib/utils';
import Staff from '@/models/Staff';
import Salary from '@/models/Salary';

// POST /api/salary/process
// Body: { month, payStaffId?, allowances?, deductions?, paymentMode?, transactionRef? }
export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const month = body.month || curMonth();

  // If marking one individual staff as paid
  if (body.payStaffId) {
    const staff = await Staff.findById(body.payStaffId).lean();
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const base = Number(staff.salary) || 0;
    const allowances = Number(body.allowances) || 0;
    const deductions = Number(body.deductions) || 0;
    const netAmount = Math.max(0, base + allowances - deductions);

    const sal = await Salary.findOneAndUpdate(
      { staff: body.payStaffId, month },
      {
        staff: body.payStaffId,
        month,
        baseSalary: base,
        allowances,
        deductions,
        netAmount,
        status: 'paid',
        paymentMode: body.paymentMode || 'Bank Transfer',
        transactionRef: body.transactionRef || '',
        remarks: body.remarks || '',
        paidOn: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true, salary: sal });
  }

  // Bulk process/generate payroll for all active staff
  const allStaff = await Staff.find({ status: { $ne: 'Inactive' } }).lean();
  if (allStaff.length > 0) {
    await Salary.bulkWrite(
      allStaff.map((s) => {
        const base = Number(s.salary) || 0;
        return {
          updateOne: {
            filter: { staff: s._id, month },
            update: {
              $setOnInsert: {
                staff: s._id,
                month,
                baseSalary: base,
                allowances: 0,
                deductions: 0,
                netAmount: base,
                status: 'pending',
              },
            },
            upsert: true,
          },
        };
      })
    );
  }

  return NextResponse.json({ ok: true, count: allStaff.length });
});

export const dynamic = 'force-dynamic';
