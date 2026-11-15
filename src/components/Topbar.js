'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, Landmark } from 'lucide-react';
import { useApi, api } from '@/lib/client';

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

  const instituteName = inst?.name || 'Demo Vidya Institute';
  const userName = me?.name || 'Ankit';
  const userRole = me?.role || 'Admin';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 md:px-7">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form
          className="relative w-full max-w-md hidden sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/students?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students, fees, classes, invoices..."
            className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-10 pr-16 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            Ctrl + K
          </div>
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Institute selector dropdown pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 cursor-pointer">
          <Landmark className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-slate-800">{instituteName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
        </div>

        {/* Notification Bell */}
        <Link
          href="/notices"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </Link>

        {/* User profile avatar & details */}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2.5 rounded-full pl-1 pr-2 py-1 transition hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left leading-tight md:block">
              <div className="text-xs font-bold text-slate-800">{userName}</div>
              <div className="text-[11px] text-slate-400 capitalize">{userRole}</div>
            </div>
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
              <div className="truncate px-3 py-2 text-xs text-slate-500">{me?.email || 'admin@edumanage.com'}</div>
              <Link
                href="/settings"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setMenu(false)}
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
