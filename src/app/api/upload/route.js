import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { uploadBuffer, removeAsset } from '@/lib/cloudinary';

const MAX = 10 * 1024 * 1024; // 10 MB
const OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// multipart/form-data: file, folder
export const POST = wrap(async (req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return bad('No file received');
  if (file.size > MAX) return bad('File is larger than 10 MB');

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return bad('Cloudinary credentials are not configured in .env.local. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Directly upload to Cloudinary (resource_type: auto handles images, pdfs, and docs)
  const folder = `edumanage/${form.get('folder') || 'staff_docs'}`;
  const res = await uploadBuffer(buffer, { folder, resource_type: 'auto' });

  return NextResponse.json({
    url: res.secure_url,
    publicId: res.public_id,
    name: file.name,
    size: file.size,
  });
});

// { publicId } -> remove asset from Cloudinary
export const DELETE = wrap(async (req) => {
  const { publicId } = await req.json();
  if (publicId) {
    await removeAsset(publicId);
  }
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';
