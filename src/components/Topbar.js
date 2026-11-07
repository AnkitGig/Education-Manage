'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, MessageCircle, UserPlus, Building2 } from 'lucide-react';
import { useApi, api } from '@/lib/client';
import { Avatar } from './ui';

export default function Topbar() {
  const router = useRouter();
  const { data: me } = useApi('/api/auth/me');
  const { data: inst } = useApi('/api/settings');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const logout = async () => {
    await api('/api/auth/logout', 'POST');
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      {/* Mobile toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
        >
          <Menu className="h-6 w-6 text-slate-700" />
        </button>
        <form
          className="relative w-full hidden sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/students?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students, teachers, classes..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-royal focus:bg-white focus:ring-4 focus:ring-royal/10"
          />
        </form>
      </div>

      {/* Right side controls matching screenshot */}
      <div className="ml-auto flex items-center gap-3">
        {/* Institute Selector / Name (e.g. Bright Future Public School) */}
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
          <Building2 className="h-4 w-4 text-royal" />
          <span>{inst?.name || 'Bright Future Public School'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Notification Bell */}
        <Link
          href="/notices"
          className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-royal"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-rose-500" />
        </Link>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1 pr-2.5 transition hover:bg-slate-50"
          >
            <Avatar name={me?.name || 'Admin'} size={32} />
            <div className="hidden text-left leading-tight md:block">
              <div className="text-xs font-bold text-slate-900">{me?.name || 'Admin'}</div>
              <div className="text-[10px] capitalize text-slate-500">{me?.role || 'Admin'}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="truncate px-3 py-2 text-xs text-slate-500">{me?.email}</div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
