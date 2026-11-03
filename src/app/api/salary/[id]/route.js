import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import Salary from '@/models/Salary';

export const PUT = wrap(async (req, { params }) => {
  const { status } = await req.json();
  const d = await Salary.findByIdAndUpdate(params.id, { status, paidOn: status === 'paid' ? new Date() : null }, { new: true });
  return d ? NextResponse.json(d) : bad('Not found', 404);
});

export const dynamic = 'force-dynamic';
