import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  return s ? NextResponse.json({ name: s.name, email: s.email, role: s.role }) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export const dynamic = 'force-dynamic';
