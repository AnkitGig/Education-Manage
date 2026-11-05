'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Wallet, CalendarCheck, MessageCircle, BarChart3, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { api, run } from '@/lib/client';
import { Field } from '@/components/ui';

const FEATURES = [
  [Wallet, 'Fees that collect themselves', 'Dues, receipts and automated reminders in one place'],
  [CalendarCheck, 'Attendance in seconds', 'Parents alerted instantly via SMS or WhatsApp'],
  [MessageCircle, 'WhatsApp built in', 'Reach every student and batch with single-click updates'],
  [BarChart3, 'Know your profit', 'Track fees collected, teacher salaries, and expenses effortlessly']
];

export default function Signup() {
  const router = useRouter();
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    instituteName: '',
    password: '',
    confirmPassword: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    setError('');
    setF({ ...f, [k]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (f.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setBusy(true);
    const r = await run(() =>
      api('/api/auth/signup', 'POST', {
        name: f.name,
        email: f.email,
        phone: f.phone,
        instituteName: f.instituteName,
        password: f.password,
      })
    );
    setBusy(false);

    if (r) {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left Hero / Brand Pane */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1d1148] via-[#2b1a6b] to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <span className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <span className="absolute right-16 top-1/3 h-40 w-40 rounded-full border border-white/10" />
        <span className="absolute right-4 top-[38%] h-72 w-72 rounded-full border border-white/10" />

        <div className="relative flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">EduManage</span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 backdrop-blur-sm mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Start free 14-day trial · No card needed
          </div>
          <h1 className="text-[38px] font-extrabold leading-[1.15] tracking-tight">
            Supercharge your coaching institute today.
          </h1>
          <p className="mt-3 text-lg text-white/70">
            Automate student admissions, batch timetables, online fee receipts, and WhatsApp communications in minutes.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(([Icon, title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-bold">{title}</div>
                  <div className="text-xs text-white/60">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-sm text-white/50">
          © {new Date().getFullYear()} EduManage · Coaching institute management
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="flex items-center justify-center bg-white p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="text-sm font-extrabold">EduManage</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Get started with your coaching management dashboard.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your Full Name" required>
              <input
                className="inp"
                value={f.name}
                onChange={set('name')}
                placeholder="e.g. Rahul Verma"
                required
              />
            </Field>
            <Field label="Phone / WhatsApp" optional>
              <input
                type="tel"
                className="inp"
                value={f.phone}
                onChange={set('phone')}
                placeholder="e.g. 9876543210"
              />
            </Field>
          </div>

          <Field label="Institute / Coaching Name" required>
            <input
              className="inp"
              value={f.instituteName}
              onChange={set('instituteName')}
              placeholder="e.g. Apex Classes & Academy"
              required
            />
          </Field>

          <Field label="Email address" required>
            <input
              type="email"
              className="inp"
              value={f.email}
              onChange={set('email')}
              placeholder="admin@apexclasses.com"
              required
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Password" required>
              <input
                type="password"
                className="inp"
                value={f.password}
                onChange={set('password')}
                minLength={6}
                placeholder="Min 6 characters"
                required
              />
            </Field>
            <Field label="Confirm Password" required>
              <input
                type="password"
                className="inp"
                value={f.confirmPassword}
                onChange={set('confirmPassword')}
                minLength={6}
                placeholder="Re-enter password"
                required
              />
            </Field>
          </div>

          <button
            type="submit"
            className="btn-primary h-11 w-full text-[15px] flex items-center justify-center gap-2 mt-2"
            disabled={busy}
          >
            {busy ? 'Creating account…' : (
              <>
                <span>Sign up now</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="pt-2 text-center text-sm text-ink-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-ink-400">
            By signing up, you agree to EduManage’s Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}

