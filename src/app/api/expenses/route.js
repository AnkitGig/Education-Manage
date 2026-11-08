import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';

// GET /api/expenses?month=YYYY-MM&category=&q=
export const GET = wrap(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const month = sp.get('month');
  const category = sp.get('category');
  const q = (sp.get('q') || '').toLowerCase().trim();

  const filter = {};

  if (month) {
    const [year, m] = month.split('-');
    const startDate = new Date(Date.UTC(+year, +m - 1, 1));
    const endDate = new Date(Date.UTC(+year, +m, 1));
    filter.date = { $gte: startDate, $lt: endDate };
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { vendor: { $regex: q, $options: 'i' } },
      { invoiceNo: { $regex: q, $options: 'i' } },
      { note: { $regex: q, $options: 'i' } },
    ];
  }

  const list = await Expense.find(filter).sort({ date: -1 }).lean();
  const total = list.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Group by category for breakdown stats
  const catBreakdown = {};
  list.forEach((e) => {
    catBreakdown[e.category] = (catBreakdown[e.category] || 0) + e.amount;
  });

  return NextResponse.json({
    data: list,
    total,
    count: list.length,
    catBreakdown,
  });
});

// POST /api/expenses
export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json();
  const exp = await Expense.create({
    ...body,
    amount: Number(body.amount) || 0,
    date: body.date ? new Date(body.date) : new Date(),
  });
  return NextResponse.json(exp, { status: 201 });
});

export const dynamic = 'force-dynamic';
