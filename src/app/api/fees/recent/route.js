import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import FeeRecord from '@/models/FeeRecord';

export const GET = wrap(async () => {
  const rows = await FeeRecord.aggregate([
    { $unwind: '$payments' },
    { $sort: { 'payments.date': -1 } },
    { $limit: 5 },
    { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 's' } },
    { $unwind: '$s' },
    { $project: { amount: '$payments.amount', mode: '$payments.mode', date: '$payments.date', receiptNo: '$payments.receiptNo', name: '$s.name', photo: '$s.photo' } },
  ]);
  return NextResponse.json({ data: rows });
});

export const dynamic = 'force-dynamic';
