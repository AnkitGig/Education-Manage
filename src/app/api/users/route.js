import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { wrap, bad } from '@/lib/crud';
import User from '@/models/User';

export const GET = wrap(async () => NextResponse.json({ data: await User.find().sort({ createdAt: 1 }).lean() }));

export const POST = wrap(async (req, _, session) => {
  if (session.role !== 'admin') return bad('Only admins can add users', 403);
  const b = await req.json();
  if (!b.password || b.password.length < 6) return bad('Password must be at least 6 characters');
  const u = await User.create({ name: b.name, email: b.email, role: b.role, password: await bcrypt.hash(b.password, 10) });
  return NextResponse.json({ _id: u._id }, { status: 201 });
});

export const dynamic = 'force-dynamic';
