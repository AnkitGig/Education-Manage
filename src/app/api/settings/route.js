import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import Institute from '@/models/Institute';

const get = async () => (await Institute.findOne().lean()) || (await Institute.create({})).toObject();

export const GET = wrap(async () => {
  const i = await get();
  return NextResponse.json({
    ...i,
    integrations: {
      whatsapp: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
      cloudinary: !!process.env.CLOUDINARY_API_SECRET,
    },
  });
});

export const PUT = wrap(async (req) => {
  const body = await req.json();
  ['_id', 'integrations', 'createdAt', 'updatedAt', '__v'].forEach((k) => delete body[k]);
  const i = await get();
  return NextResponse.json(await Institute.findByIdAndUpdate(i._id, { $set: body }, { new: true }));
});

export const dynamic = 'force-dynamic';
