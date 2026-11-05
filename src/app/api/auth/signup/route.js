import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, cookieOpts } from '@/lib/auth';
import User from '@/models/User';
import Institute from '@/models/Institute';

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password, instituteName, phone } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    // Create or link institute details if provided
    const instName = instituteName && instituteName.trim() ? instituteName.trim() : `${name.trim()}'s Institute`;
    const instCount = await Institute.countDocuments();
    if (instCount === 0) {
      await Institute.create({
        name: instName,
        email: cleanEmail,
        phone: phone || '',
      });
    }

    const token = await signToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set('token', token, cookieOpts);
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

