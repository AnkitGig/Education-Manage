import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { wrap, bad } from '@/lib/crud';
import User from '@/models/User';

export const PUT = wrap(async (req, { params }, session) => {
  if (session.role !== 'admin') return bad('Only admins can edit users', 403);
  const b = await req.json();
  if (b.password) b.password = await bcrypt.hash(b.password, 10); else delete b.password;
  const u = await User.findByIdAndUpdate(params.id, b, { new: true });
  return u ? NextResponse.json({ ok: true }) : bad('Not found', 404);
});

export const DELETE = wrap(async (_, { params }, session) => {
  if (session.role !== 'admin') return bad('Only admins can delete users', 403);
  if (params.id === session.id) return bad("You can't delete your own account");
  await User.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';
