import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { uploadBuffer, removeAsset } from '@/lib/cloudinary';

const MAX = 5 * 1024 * 1024;
const OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// multipart/form-data: file, folder
export const POST = wrap(async (req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return bad('No file received');
  if (!OK.includes(file.type)) return bad('Only JPG, PNG, WEBP or PDF files are allowed');
  if (file.size > MAX) return bad('File is larger than 5 MB');
  const res = await uploadBuffer(Buffer.from(await file.arrayBuffer()), { folder: `edumanage/${form.get('folder') || 'misc'}` });
  return NextResponse.json({ url: res.secure_url, publicId: res.public_id, name: file.name, size: file.size });
});

// { publicId } -> remove from Cloudinary
export const DELETE = wrap(async (req) => {
  const { publicId } = await req.json();
  if (publicId) await removeAsset(publicId);
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';
