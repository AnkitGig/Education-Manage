import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';

export const GET = wrap(async (req, { params }) => {
  await connectDB();
  const exp = await Expense.findById(params.id).lean();
  if (!exp) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  return NextResponse.json(exp);
});

export const PUT = wrap(async (req, { params }) => {
  await connectDB();
  const body = await req.json();
  if (body.amount !== undefined) body.amount = Number(body.amount) || 0;
  if (body.date) body.date = new Date(body.date);
  const updated = await Expense.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(updated);
});

export const DELETE = wrap(async (req, { params }) => {
  await connectDB();
  await Expense.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
});

export const dynamic = 'force-dynamic';
