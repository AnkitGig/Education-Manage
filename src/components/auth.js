'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/landing/Logo';

const BULLETS = [
  'Manage Students & Classes',
  'Track Attendance & Fees',
  'Grow Your Institute Easily',
];

export { Logo };

export function Input({ icon: Icon, label, required, optional, compact, type = 'text', ...props }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';

  const field = (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        required={required}
        type={isPw && show ? 'text' : type}
        className={`h-12 w-full rounded-xl border border-slate-200 bg-white ${Icon ? 'pl-11' : 'pl-4'} ${isPw ? 'pr-11' : 'pr-4'} text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-royal focus:ring-4 focus:ring-royal/10`}
      />
      {isPw && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
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
    <div className="text-center">
      <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px]">{title}</h2>
      {sub && <p className="mt-1.5 text-[15px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function SubmitButton({ busy, busyText = 'Please wait…', children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-royal text-[16px] font-semibold text-white shadow-md shadow-blue-600/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {busy ? busyText : children}
    </button>
  );
}

export function SocialButtons() {
  return (
    <div className="mt-6">
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-3 text-xs text-slate-400">or continue with</span>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}

const Squiggle = () => (
  <svg className="absolute -bottom-2 left-0 h-2.5 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
    <path d="M2 8 C 30 2, 60 12, 100 6 S 170 3, 198 7" stroke="#1f5fe0" strokeWidth="3.2" fill="none" strokeLinecap="round" />
  </svg>
);

export function AuthShell({ onSubmit, wide = false, isLogin = false, children }) {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        
        {/* Left Side: Full-height Hero section with background image & overlay */}
        <section className="relative hidden w-full overflow-hidden bg-slate-900 lg:block lg:w-1/2 xl:w-[52%]">
          {/* Background Hero Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/hero.webp"
            alt="Tutoring Institute Teacher"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* White soft gradient overlay at top-left so logo and text are crystal clear */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/70 to-black/30" />

          {/* Left Content */}
          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14 2xl:p-16">
            <div>
              <Link href="/" aria-label="EduManage home" className="inline-block">
                <Logo />
              </Link>

              <div className="mt-14 max-w-[460px] xl:mt-20">
                <h1 className="text-[40px] font-extrabold leading-[1.12] tracking-tight text-slate-900 xl:text-[46px] 2xl:text-[50px]">
                  Manage Your
                  <br />
                  Tutoring Institute
                  <br />
                  with{' '}
                  <span className="relative inline-block text-royal">
                    EduManage
                    <Squiggle />
                  </span>
                </h1>

                <ul className="mt-8 space-y-4 xl:mt-10">
                  {BULLETS.map((b) => (
                    <li key={b} className="flex items-center gap-3.5 text-[17px] font-semibold text-slate-800">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal text-white shadow-sm shadow-blue-500/40">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 text-sm font-medium text-slate-700/90">
              Trusted by 1,000+ coaching institutes across India
            </div>
          </div>
        </section>

        {/* Right Side: Fullscreen Form */}
        <section className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 md:py-16 lg:px-14 xl:px-20">
          {/* Mobile Logo */}
          <div className="mb-6 flex justify-center lg:hidden">
            <Link href="/" aria-label="EduManage home">
              <Logo />
            </Link>
          </div>

          <div className={`mx-auto w-full ${wide ? 'max-w-[480px]' : 'max-w-[420px]'}`}>
            <form onSubmit={onSubmit}>
              {children}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
