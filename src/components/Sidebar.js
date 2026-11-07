'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, BookOpen, Wallet, CalendarCheck, UserCog, Banknote, MessageCircle, BarChart3, Bell, Settings, GraduationCap, Crown, X } from 'lucide-react';
import { useApi } from '@/lib/client';
import { cn, inr } from './ui';

const GROUPS = [
  ['Overview', [['/dashboard', 'Dashboard', LayoutDashboard]]],
  ['Academics', [['/students', 'Students', Users], ['/courses', 'Classes & Sections', BookOpen], ['/attendance', 'Attendance', CalendarCheck], ['/staff', 'Staff Management', UserCog]]],
  ['Finance', [['/fees', 'Fees & Payments', Wallet], ['/salary', 'Salary & Expenses', Banknote], ['/reports', 'Reports', BarChart3]]],
  ['Communication', [['/whatsapp', 'WhatsApp Messages', MessageCircle], ['/notices', 'Notices & Announcements', Bell]]],
  ['System', [['/settings', 'Settings', Settings]]],
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data: inst } = useApi('/api/settings');
  useEffect(() => { const h = () => setOpen((o) => !o); window.addEventListener('toggle-sidebar', h); return () => window.removeEventListener('toggle-sidebar', h); }, []);
  useEffect(() => setOpen(false), [path]);

  const plan = inst?.plan;
  const days = plan?.validTill ? Math.max(0, Math.ceil((new Date(plan.validTill) - Date.now()) / 864e5)) : 0;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden bg-gradient-to-b from-[#1d1148] via-[#251a63] to-[#2b1a6b] p-4 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <span className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative mb-5 flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-3">
            {inst?.logo?.url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={inst.logo.url} alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
              : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25"><GraduationCap className="h-6 w-6" /></span>}
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight">EduManage</div>
              <div className="max-w-[150px] truncate text-[11px] text-white/60">{inst?.name || 'Coaching Institute'}</div>
            </div>
          </div>
          <button className="rounded-lg p-1 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="relative flex-1 space-y-3 overflow-y-auto pr-1">
          {GROUPS.map(([group, items]) => (
            <div key={group}>
              <div className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-white/40">{group}</div>
              <div className="space-y-0.5">
                {items.map(([href, label, Icon]) => {
                  const active = path === href || path.startsWith(href + '/');
                  return (
                    <Link key={href} href={href} className={cn('group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition', active ? 'bg-white text-brand-800 shadow-lg shadow-black/20' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
                      <Icon className={cn('h-[18px] w-[18px]', active ? 'text-brand-600' : 'text-white/60 group-hover:text-white')} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative mt-4 hidden rounded-2xl bg-white/10 [@media(min-height:830px)]:block p-3.5 ring-1 ring-white/15 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow"><Crown className="h-5 w-5" /></span>
            <div className="leading-tight">
              <div className="text-sm font-bold">{plan?.name || 'Standard'} Plan</div>
              <div className="text-xs text-white/70">{inr(plan?.price ?? 399)} / month</div>
            </div>
          </div>
          <div className="my-3 h-1.5 rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400" style={{ width: `${Math.min(100, (days / 30) * 100)}%` }} /></div>
          <div className="mb-3 text-xs text-white/60">Valid till {plan?.validTill ? new Date(plan.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–'}</div>
          <Link href="/settings" className="flex h-9 w-full items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-800 transition hover:bg-brand-50">Upgrade plan</Link>
        </div>
      </aside>
    </>
  );
}
