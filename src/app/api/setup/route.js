import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, cookieOpts } from '@/lib/auth';
import User from '@/models/User';
import Institute from '@/models/Institute';

// GET  -> is first-time setup needed?
export async function GET() {
  await connectDB();
  return NextResponse.json({ needsSetup: (await User.countDocuments()) === 0 });
}

// POST -> create the first admin (only works while there are zero users)
export async function POST(req) {
  try {
    await connectDB();
    if (await User.countDocuments()) return NextResponse.json({ error: 'Setup already completed' }, { status: 403 });
    const { name, email, password, institute } = await req.json();
    if (!name || !email || !password || password.length < 6)
      return NextResponse.json({ error: 'Name, email and a password of 6+ characters are required' }, { status: 400 });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'admin' });
    await Institute.create({ name: institute || 'My Coaching Institute', email });
    const token = await signToken({ id: String(user._id), name, email: user.email, role: 'admin' });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', token, cookieOpts);
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
