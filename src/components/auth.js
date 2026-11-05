'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Zap, Check, Eye, EyeOff, ArrowRight, Users, Star, BarChart3 } from 'lucide-react';

const POINTS = [
  'Student & Admission Management',
  'Class & Batch Scheduling',
  'Attendance Tracking',
  'Fees & Payment Collection',
  'Parent Communication (WhatsApp/SMS)',
  'Reports & Analytics',
];

const STATS = [
  [Users, 'text-violet-600', '500+', 'Institutes Trust Us'],
  [Star, 'text-amber-400', '50,000+', 'Students Managed'],
  [BarChart3, 'text-violet-600', '99.9%', 'Uptime & Reliability'],
];

export function Logo({ className = 'text-[28px]' }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-extrabold tracking-tight text-slate-900 ${className}`}>
      <GraduationCap className="h-[1.3em] w-[1.3em] fill-violet-600 text-violet-700" strokeWidth={1.8} />
      <span>EduManage</span>
    </Link>
  );
}

/* Pill input with left icon. type="password" gets an eye toggle automatically.
   Pass `label` (+ required / optional) to show a label above the pill. */
export function Input({ icon: Icon, label, required, optional, compact, type = 'text', ...props }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  const size = compact ? 'h-12 pl-12 pr-12 text-[15px]' : 'h-14 pl-14 pr-14 text-[16px]';

  const field = (
    <div className="relative">
      <Icon className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-800 ${compact ? 'left-4' : 'left-5'}`} />
      <input
        {...props}
        required={required}
        type={isPw && show ? 'text' : type}
        className={`${size} w-full rounded-full border border-slate-200 bg-white text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-100`}
      />
      {isPw && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-800 transition hover:text-violet-700"
        >
          {show ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      )}
    </div>
  );

  if (!label) return field;
  return (
    <label className="block">
      <span className="mb-1.5 ml-4 block text-[13px] font-semibold text-slate-700">
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
    <div className="mt-7">
      <h2 className="text-[32px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[34px]">{title}</h2>
      <p className="mt-1 text-[16px] text-slate-500 sm:text-[17px]">{sub}</p>
    </div>
  );
}

export function SubmitButton({ busy, busyText = 'Please wait…', children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-800 via-violet-700 to-violet-600 text-[19px] font-bold text-white shadow-lg shadow-violet-500/40 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {busy ? busyText : (
        <>
          {children}
          <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
        </>
      )}
    </button>
  );
}

/* Full page: background, navbar, left hero, and the right-hand form card. */
export function AuthShell({ onSubmit, wide = false, children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#ece6ff]">
      {/* Illustration goes at /public/auth-hero.jpg; gradient shows if it is missing */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/auth-hero.jpg'), linear-gradient(135deg,#f5f0ff 0%,#e6deff 50%,#d5e0ff 100%)` }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/10 to-violet-200/30" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 sm:px-8 lg:px-14">
        <header className="flex items-center justify-between py-5 lg:py-6">
          <Logo />
        </header>

        <main className="grid flex-1 items-center gap-10 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:pb-10">
          {/* Left hero */}
          <section className="hidden flex-col self-stretch lg:flex">
            <div className="my-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100/80 px-4 py-2 text-[15px] font-semibold text-slate-900">
                <Zap className="h-4 w-4 fill-amber-400 text-amber-400" />
                All-in-One Institute Management
              </span>

              <h1 className="mt-7 text-[52px] font-extrabold leading-[1.1] tracking-tight text-slate-900 xl:text-[58px]">
                Manage Students,
                <br />
                Classes, Fees &amp; More
                <br />
                <span className="relative inline-block text-violet-600">
                  Effortlessly
                  <svg className="absolute -bottom-3 left-3 w-[75%]" viewBox="0 0 220 14" fill="none" aria-hidden>
                    <path d="M3 10C55 3 130 2 217 7" stroke="#FBBF24" strokeWidth="4.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-10 max-w-md text-[19px] leading-relaxed text-slate-500">
                A complete institute management platform for coaching centers, tutoring businesses and learning academies.
              </p>

              <ul className="mt-8 space-y-3.5">
                {POINTS.map((p) => (
                  <li key={p} className="flex items-center gap-3.5 text-[16px] font-medium text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4" strokeWidth={3.5} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex w-fit items-center rounded-[32px] bg-white/85 px-7 py-5 shadow-xl shadow-violet-300/30 backdrop-blur-xl">
              {STATS.map(([Icon, color, value, label], i) => (
                <div key={label} className={`flex items-center gap-3.5 ${i ? 'ml-7 border-l border-slate-200 pl-7' : ''}`}>
                  <Icon className={`h-9 w-9 ${color}`} strokeWidth={1.6} />
                  <div>
                    <div className="text-[26px] font-extrabold leading-none text-slate-900">{value}</div>
                    <div className="mt-1 text-[14px] text-slate-600">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Form card */}
          <section className="flex justify-center lg:justify-end">
            <form
              onSubmit={onSubmit}
              className={`relative w-full overflow-hidden rounded-[40px] bg-white/95 p-8 shadow-[0_30px_80px_-20px_rgba(91,33,182,0.4)] backdrop-blur-xl sm:p-10 ${wide ? 'max-w-[580px]' : 'max-w-[470px]'}`}
            >
              <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400 to-violet-700" />
              <span aria-hidden className="pointer-events-none absolute -right-14 -top-[6.5rem] h-44 w-44 rounded-full bg-white" />
              <div className="relative">
                <div className="flex justify-center">
                  <Logo className="text-[26px]" />
                </div>
                {children}
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
