'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Building2 } from 'lucide-react';
import { api, run } from '@/lib/client';
import { AuthShell, Input, Heading, SubmitButton } from '@/components/auth';

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
    <AuthShell onSubmit={submit} wide>
      <Heading title="Create your account" sub="Get started with your coaching management dashboard." />

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input compact icon={User} label="Your Full Name" required value={f.name} onChange={set('name')} placeholder="e.g. Rahul Verma" />
          <Input compact icon={Phone} label="Phone / WhatsApp" optional type="tel" value={f.phone} onChange={set('phone')} placeholder="e.g. 9876543210" />
        </div>

        <Input compact icon={Building2} label="Institute / Coaching Name" required value={f.instituteName} onChange={set('instituteName')} placeholder="e.g. Apex Classes & Academy" />

        <Input compact icon={Mail} label="Email address" required type="email" value={f.email} onChange={set('email')} placeholder="admin@apexclasses.com" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input compact icon={Lock} label="Password" required type="password" value={f.password} onChange={set('password')} minLength={6} placeholder="Min 6 characters" />
          <Input compact icon={Lock} label="Confirm Password" required type="password" value={f.confirmPassword} onChange={set('confirmPassword')} minLength={6} placeholder="Re-enter password" />
        </div>
      </div>

      <SubmitButton busy={busy} busyText="Creating account…">Sign up now</SubmitButton>

      <p className="mt-6 text-center text-[15px] text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="ml-1 font-bold text-violet-700 hover:underline">Sign in</Link>
      </p>

      <p className="mt-3 text-center text-xs text-slate-400">
        By signing up, you agree to EduManage’s Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}