import { NextResponse } from 'next/server';
import { wrap, collection } from '@/lib/crud';
import { sendBulk, fill } from '@/lib/whatsapp';
import Notice from '@/models/Notice';
import Student from '@/models/Student';
import Institute from '@/models/Institute';

const base = collection(Notice, { search: ['title', 'body'], filters: ['type', 'status'] });

export const GET = wrap(async (req, ctx, s) => {
  const res = await base.GET(req, ctx);
  const data = await res.json();
  const st = await Notice.aggregate([{ $group: { _id: '$status', n: { $sum: 1 }, v: { $sum: '$views' } } }]);
  const stats = { total: 0, published: 0, scheduled: 0, draft: 0, views: 0 };
  st.forEach((x) => { stats[x._id] = x.n; stats.total += x.n; stats.views += x.v; });
  return NextResponse.json({ ...data, stats });
});

// { title, body, type, audience:[students|parents|teachers], status, scheduledAt, whatsapp }
export const POST = wrap(async (req) => {
  const b = await req.json();
  if (b.scheduledAt && b.status !== 'draft') b.status = 'scheduled';
  if (b.status === 'published') b.publishedAt = new Date();
  const notice = await Notice.create(b);
  if (notice.status === 'published' && notice.whatsapp) {
    const inst = await Institute.findOne().lean();
    const students = await Student.find({ status: 'active' }).lean();
    const to = (s) => (notice.audience.includes('parents') ? s.parentMobile : s.mobile) || s.parentMobile;
    await sendBulk({
      title: notice.title, template: 'announcement',
      items: students.map((s) => ({ to: to(s), text: fill('Dear {{parent}},\n\n*{{title}}*\n{{message}}\n\n{{institute}}', { parent: s.parentName, title: notice.title, message: notice.body, institute: inst?.name || '' }) })),
    });
  }
  return NextResponse.json(notice, { status: 201 });
});

export const dynamic = 'force-dynamic';
