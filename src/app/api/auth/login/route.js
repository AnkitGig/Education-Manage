import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, cookieOpts } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user || user.status !== 'active' || !(await bcrypt.compare(password || '', user.password)))
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    user.lastLogin = new Date();
    await user.save();
    const token = await signToken({ id: String(user._id), name: user.name, email: user.email, role: user.role });
    const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
    res.cookies.set('token', token, cookieOpts);
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
