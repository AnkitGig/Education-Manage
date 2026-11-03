import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { curMonth, lastMonths } from '@/lib/utils';
import { monthFinance, financeTrend } from '@/lib/finance';

export const GET = wrap(async (req) => {
  const month = new URL(req.url).searchParams.get('month') || curMonth();
  const [current, trend, prev] = await Promise.all([monthFinance(month), financeTrend(6), monthFinance(lastMonths(2, new Date(month + '-01'))[0])]);
  const vsPrev = prev.profit ? +(((current.profit - prev.profit) / Math.abs(prev.profit)) * 100).toFixed(1) : 0;
  return NextResponse.json({ current, trend, vsPrev });
});

export const dynamic = 'force-dynamic';
