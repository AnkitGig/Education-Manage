'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Wallet, CalendarCheck, MessageCircle, BarChart3 } from 'lucide-react';
import { api, run } from '@/lib/client';
import { Field } from '@/components/ui';

const FEATURES = [[Wallet, 'Fees that collect themselves', 'Dues, receipts and reminders in one place'], [CalendarCheck, 'Attendance in seconds', 'Absent parents are alerted automatically'], [MessageCircle, 'WhatsApp built in', 'Reach every batch with a single tap'], [BarChart3, 'Know your profit', 'Income, salaries and expenses at a glance']];

export default function Login() {
  const router = useRouter();
  const [setup, setSetup] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', institute: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { fetch('/api/setup').then((r) => r.json()).then((j) => setSetup(!!j.needsSetup)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const r = await run(() => api(setup ? '/api/setup' : '/api/auth/login', 'POST', f));
    setBusy(false);
    if (r) router.replace('/dashboard');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1d1148] via-[#2b1a6b] to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <span className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <span className="absolute right-16 top-1/3 h-40 w-40 rounded-full border border-white/10" />
        <span className="absolute right-4 top-[38%] h-72 w-72 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25"><GraduationCap className="h-6 w-6" /></span><span className="text-xl font-extrabold tracking-tight">EduManage</span></div>
        <div className="relative max-w-lg">
          <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight">Run your whole institute from one calm dashboard.</h1>
          <p className="mt-4 text-lg text-white/70">Admissions, fees, attendance, teachers and parent communication — without the spreadsheets.</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map(([I, t, d]) => (
              <li key={t} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><I className="h-5 w-5" /></span><div><div className="text-sm font-bold">{t}</div><div className="text-sm text-white/60">{d}</div></div></li>
            ))}
          </ul>
        </div>
        <div className="relative text-sm text-white/50">© {new Date().getFullYear()} EduManage · Coaching institute management</div>
      </div>

      <div className="flex items-center justify-center bg-white p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><GraduationCap className="h-5 w-5" /></span><span className="text-xl font-extrabold">EduManage</span></div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{setup ? 'Set up your institute' : 'Welcome back'}</h2>
            <p className="mt-1.5 text-sm text-ink-500">{setup ? 'Create the admin account to get started.' : 'Sign in to manage your institute.'}</p>
          </div>
          {setup && <>
            <Field label="Institute name" required><input className="inp" value={f.institute} onChange={set('institute')} required /></Field>
            <Field label="Your name" required><input className="inp" value={f.name} onChange={set('name')} required /></Field>
          </>}
          <Field label="Email" required><input type="email" className="inp" value={f.email} onChange={set('email')} placeholder="you@institute.com" required /></Field>
          <Field label="Password" required><input type="password" className="inp" value={f.password} onChange={set('password')} minLength={6} placeholder="At least 6 characters" required /></Field>
          <button className="btn-primary h-11 w-full text-[15px]" disabled={busy}>{busy ? 'Please wait…' : setup ? 'Create account' : 'Sign in'}</button>
          {setup && <p className="text-center text-xs text-ink-500">This first account becomes the institute admin.</p>}
        </form>
      </div>
    </div>
  );
}
