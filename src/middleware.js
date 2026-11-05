import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/', '/login', '/signup', '/api/auth/login', '/api/auth/signup', '/api/setup'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname) || pathname.startsWith('/api/cron') || pathname.startsWith('/landing')) return NextResponse.next();
  const token = req.cookies.get('token')?.value;
  try {
    if (!token) throw new Error('no token');
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
