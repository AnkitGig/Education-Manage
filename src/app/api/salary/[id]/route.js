import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Salary from '@/models/Salary';

export const GET = wrap(async (req, { params }) => {
  await connectDB();
  const sal = await Salary.findById(params.id).populate('staff').lean();
  if (!sal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(sal);
});

export const PUT = wrap(async (req, { params }) => {
  await connectDB();
  const body = await req.json();

  if (body.status === 'paid' && !body.paidOn) {
    body.paidOn = new Date();
  }
  if (body.status === 'pending') {
    body.paidOn = null;
  }

  // Recalculate net if baseSalary, allowances, or deductions changed
  if (body.baseSalary !== undefined || body.allowances !== undefined || body.deductions !== undefined) {
    const existing = await Salary.findById(params.id).lean();
    const base = body.baseSalary !== undefined ? Number(body.baseSalary) : existing.baseSalary || 0;
    const allowances = body.allowances !== undefined ? Number(body.allowances) : existing.allowances || 0;
    const deductions = body.deductions !== undefined ? Number(body.deductions) : existing.deductions || 0;
    body.netAmount = Math.max(0, base + allowances - deductions);
  }

  const updated = await Salary.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(updated);
});

export const DELETE = wrap(async (req, { params }) => {
  await connectDB();
  await Salary.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
});

export const dynamic = 'force-dynamic';
