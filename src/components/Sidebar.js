'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  UserCog,
  Wallet,
  Banknote,
  BarChart3,
  MessageCircle,
  Bell,
  Settings,
  ChevronDown,
  X,
} from 'lucide-react';
import { useApi } from '@/lib/client';
import { cn } from './ui';

// Keep your exact original menu routes and items
const GROUPS = [
  ['Overview', [['/dashboard', 'Dashboard', LayoutDashboard]]],
  [
    'Academics',
    [
      ['/students', 'Students', Users],
      ['/courses', 'Classes & Sections', BookOpen],
      ['/attendance', 'Attendance', CalendarCheck],
      ['/staff', 'Staff Management', UserCog],
    ],
  ],
  [
    'Finance',
    [
      ['/fees', 'Fees & Payments', Wallet],
      ['/salary', 'Salary & Expenses', Banknote],
      ['/reports', 'Reports', BarChart3],
    ],
  ],
  [
    'Communication',
    [
      ['/whatsapp', 'WhatsApp Messages', MessageCircle],
      ['/notices', 'Notices & Announcements', Bell],
    ],
  ],
  ['System', [['/settings', 'Settings', Settings]]],
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data: inst } = useApi('/api/settings');

  useEffect(() => {
    const h = () => setOpen((o) => !o);
    window.addEventListener('toggle-sidebar', h);
    return () => window.removeEventListener('toggle-sidebar', h);
  }, []);

  useEffect(() => setOpen(false), [path]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-[#003B5C] text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 select-none shadow-2xl lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header matching screenshot */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B8E8] text-white shadow-md shadow-cyan-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-0.5 text-[15px] font-bold tracking-tight text-white">
                EduManage<span className="text-[10px] text-cyan-300 font-normal">®</span>
              </div>
              <div className="max-w-[130px] truncate text-[10.5px] font-medium text-cyan-100/70">
                {inst?.name || 'Coaching Institute ERP'}
              </div>
            </div>
          </Link>
          <button
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4 custom-sidebar-scroll">
          {GROUPS.map(([group, items]) => (
            <div key={group}>
              {group !== 'Overview' && (
                <div className="flex items-center justify-between px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400/90">
                  <span>{group}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </div>
              )}
              <div className="space-y-0.5">
                {items.map(([href, label, Icon]) => {
                  const active =
                    href === '/dashboard'
                      ? path === '/dashboard'
                      : path === href || path.startsWith(href + '/');

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        active
                          ? 'bg-[#00B8E8] text-white font-bold shadow-md shadow-cyan-600/30'
                          : 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-white' : 'text-cyan-200/70 group-hover:text-white'
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
