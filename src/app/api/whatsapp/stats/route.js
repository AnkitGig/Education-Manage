import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import Message from '@/models/Message';

export const GET = wrap(async () => {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const [agg, recent] = await Promise.all([
    Message.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: null, sent: { $sum: '$recipients' }, delivered: { $sum: '$delivered' }, read: { $sum: '$read' }, replied: { $sum: '$replied' }, failed: { $sum: '$failed' } } }]),
    Message.find().sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  return NextResponse.json({ stats: agg[0] || { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 }, recent });
});

export const dynamic = 'force-dynamic';
