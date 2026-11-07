'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff, ArrowRight, Users, GraduationCap, MessageCircle, Star } from 'lucide-react';
import Logo from '@/components/landing/Logo';

const POINTS = [
  'Student & admission management',
  'Automated fee receipts & reminders',
  'Smart attendance tracking',
  'Instant WhatsApp notifications to parents',
  'Teachers, batches & payroll reports',
];

const STATS = [
  [Users, '1,000+', 'Institutes'],
  [GraduationCap, '5,00,000+', 'Students'],
  [MessageCircle, '1 Cr+', 'WhatsApp Sent'],
  [Star, '99.9%', 'Reliability'],
];

export { Logo };

/* Modern clean input matching landing theme */
export function Input({ icon: Icon, label, required, optional, compact, type = 'text', ...props }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  const heightClass = compact ? 'h-11' : 'h-12';

  const field = (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        required={required}
        type={isPw && show ? 'text' : type}
        className={`${heightClass} w-full rounded-xl border border-slate-200 bg-white ${Icon ? 'pl-11' : 'pl-4'} ${isPw ? 'pr-11' : 'pr-4'} text-[15px] text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-royal focus:ring-4 focus:ring-royal/10`}
      />
      {isPw && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy"
        >
          {show ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      )}
    </div>
  );

  if (!label) return field;
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
        {optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </span>
      {field}
    </label>
  );
}

export function Heading({ title, sub }) {
  return (
    <div className="mt-6">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-navy sm:text-[30px]">{title}</h2>
      <p className="mt-1.5 text-[15px] text-slate-600">{sub}</p>
    </div>
  );
}

export function SubmitButton({ busy, busyText = 'Please wait…', children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-royal text-[15px] font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-royal-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {busy ? busyText : (
        <>
          {children}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

const Flag = () => (
  <svg width="20" height="14" viewBox="0 0 22 15" className="rounded-[2px] ring-1 ring-black/10" aria-hidden="true">
    <rect width="22" height="5" fill="#ff9933" />
    <rect y="5" width="22" height="5" fill="#fff" />
    <rect y="10" width="22" height="5" fill="#138808" />
    <circle cx="11" cy="7.5" r="1.8" fill="none" stroke="#000080" strokeWidth=".7" />
  </svg>
);

const Squiggle = () => (
  <svg className="absolute -bottom-2.5 left-0 h-3 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
    <path d="M2 8 C 30 2, 60 12, 100 6 S 170 3, 198 7" stroke="#1f5fe0" strokeWidth="3.2" fill="none" strokeLinecap="round" />
  </svg>
);

/* Full auth layout matching landing page branding */
export function AuthShell({ onSubmit, wide = false, children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-r from-white via-[#f4f8ff] to-[#e9f1ff] font-sans text-navy">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1240px] flex-col px-5 sm:px-8">
        {/* Top bar with landing logo */}
        <header className="flex h-16 items-center justify-between py-4">
          <Link href="/" aria-label="EduManage home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 transition hover:text-royal"
          >
            ← Back to Home
          </Link>
        </header>

        <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-12">
          {/* Left hero info - matching landing page design */}
          <section className="hidden flex-col justify-center lg:flex">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium shadow-sm ring-1 ring-slate-200">
                <Flag />
                Built for coaching institutes in India
              </span>

              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.12] tracking-tight text-navy xl:text-[46px]">
                Run your coaching institute without{' '}
                <span className="relative inline-block text-royal">
                  the chaos
                  <Squiggle />
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-slate-600">
                Admissions, fees, attendance, teachers and parent updates on WhatsApp, all in one simple dashboard.
              </p>

              <ul className="mt-7 space-y-3">
                {POINTS.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[15px] font-medium text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats bar */}
            <div className="mt-10 grid grid-cols-4 gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
              {STATS.map(([Icon, value, label]) => (
                <div key={label}>
                  <div className="text-[20px] font-extrabold text-navy">{value}</div>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Form card */}
          <section className="flex justify-center lg:justify-end">
            <form
              onSubmit={onSubmit}
              className={`w-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-blue-900/5 sm:p-9 ${wide ? 'max-w-[560px]' : 'max-w-[460px]'}`}
            >
              <div className="flex justify-center">
                <Logo />
              </div>
              {children}
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
