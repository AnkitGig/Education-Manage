'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import Logo from './Logo';

const MENUS = [
  ['Product', [['Student management', '#features'], ['Fees & receipts', '#features'], ['Attendance & alerts', '#features'], ['WhatsApp notifications', '#features']]],
  ['Solutions', [['School coaching', '#types'], ['Competitive exam', '#types'], ['Skill & hobby classes', '#types'], ['Tuition & private classes', '#types']]],
  ['Resources', [['How it works', '#how'], ['Why EduManage', '#why'], ['FAQ', '#faq']]],
];

export default function LandingNav({ loggedIn }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="EduManage home"><Logo /></Link>
        <nav className="hidden items-center gap-9 lg:flex">
          {MENUS.map(([label, items]) => (
            <div key={label} className="group relative">
              <button className="flex items-center gap-1 py-5 text-[15px] font-medium text-navy transition group-hover:text-royal">{label}<ChevronDown className="h-4 w-4 transition group-hover:rotate-180" /></button>
              <div className="invisible absolute left-1/2 top-full w-56 -translate-x-1/2 translate-y-1 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {items.map(([l, h]) => <a key={l} href={h} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-royal-50 hover:text-royal">{l}</a>)}
              </div>
            </div>
          ))}
          <a href="#pricing" className="text-[15px] font-medium text-navy transition hover:text-royal">Pricing</a>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {loggedIn ? (
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-lg bg-royal px-5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-royal-700">Open dashboard</Link>
          ) : (<>
            <Link href="/login" className="inline-flex h-10 items-center rounded-lg border border-royal px-5 text-sm font-semibold text-royal transition hover:bg-royal-50">Log in</Link>
            <Link href="/signup" className="inline-flex h-10 items-center rounded-lg bg-royal px-5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-royal-700">Get started free</Link>
          </>)}
        </div>
        <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-slate-200 bg-white px-5 pb-5 pt-2 lg:hidden">
          {MENUS.map(([label, items]) => (
            <div key={label} className="border-b border-slate-100 py-2">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
              {items.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-royal-50">{l}</a>)}
            </div>
          ))}
          <a href="#pricing" onClick={() => setOpen(false)} className="block px-3 py-3 text-sm font-semibold text-navy">Pricing</a>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg border border-royal text-sm font-semibold text-royal">Log in</Link>
            <Link href={loggedIn ? '/dashboard' : '/signup'} className="inline-flex h-11 items-center justify-center rounded-lg bg-royal text-sm font-semibold text-white">{loggedIn ? 'Dashboard' : 'Sign up'}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
