'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, MessageCircle, UserPlus } from 'lucide-react';
import { useApi, api } from '@/lib/client';
import { Avatar } from './ui';

export default function Topbar() {
  const router = useRouter();
  const { data: me } = useApi('/api/auth/me');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const logout = async () => { await api('/api/auth/logout', 'POST'); router.replace('/login'); };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink/[.06] bg-white/80 px-4 py-3 backdrop-blur-xl lg:px-8">
      <button className="rounded-lg p-1.5 hover:bg-brand-50 lg:hidden" onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}><Menu className="h-6 w-6" /></button>
      <form className="relative max-w-md flex-1" onSubmit={(e) => { e.preventDefault(); router.push(`/students?q=${encodeURIComponent(q)}`); }}>
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students by name, phone or ID…" className="h-10 w-full rounded-xl border border-transparent bg-brand-50/60 pl-10 pr-3 text-sm outline-none transition placeholder:text-ink-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" />
      </form>
      <div className="ml-auto flex items-center gap-2.5">
        <Link href="/students/new" className="btn-outline hidden md:inline-flex"><UserPlus className="h-4 w-4" />Add student</Link>
        <Link href="/whatsapp" className="btn-green hidden sm:inline-flex"><MessageCircle className="h-4 w-4" />WhatsApp</Link>
        <Link href="/notices" className="relative rounded-xl border border-ink/10 bg-white p-2.5 transition hover:bg-brand-50"><Bell className="h-[18px] w-[18px] text-ink-700" /></Link>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-brand-50">
            <Avatar name={me?.name || 'User'} size={36} />
            <div className="hidden text-left leading-tight md:block">
              <div className="text-sm font-bold">{me?.name || '…'}</div>
              <div className="text-xs capitalize text-ink-500">{me?.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-ink/[.06] bg-white p-1.5 shadow-pop">
              <div className="truncate px-3 py-2 text-xs text-ink-500">{me?.email}</div>
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"><LogOut className="h-4 w-4" />Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
