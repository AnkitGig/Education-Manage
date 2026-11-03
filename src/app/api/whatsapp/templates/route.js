import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { DEFAULT_TEMPLATES } from '@/lib/templates';
import Template from '@/models/Template';

// Seeds the default templates the first time they're requested
export const GET = wrap(async () => {
  if ((await Template.countDocuments()) === 0) await Template.insertMany(DEFAULT_TEMPLATES);
  return NextResponse.json({ data: await Template.find().sort({ createdAt: 1 }).lean() });
});
export const POST = wrap(async (req) => {
  const b = await req.json();
  return NextResponse.json(await Template.create({ ...b, key: b.key || b.title.toLowerCase().replace(/\W+/g, '_') }), { status: 201 });
});

export const dynamic = 'force-dynamic';
