'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Building2 } from 'lucide-react';
import { api, run } from '@/lib/client';
import { AuthShell, Input, Heading, SubmitButton, SocialButtons } from '@/components/auth';

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
      <Heading
        title="Get Started Free"
        sub="Create your institute account in 2 minutes"
      />

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input compact icon={User} required value={f.name} onChange={set('name')} placeholder="Your full name" />
          <Input compact icon={Phone} optional type="tel" value={f.phone} onChange={set('phone')} placeholder="Phone / WhatsApp" />
        </div>

        <Input compact icon={Building2} required value={f.instituteName} onChange={set('instituteName')} placeholder="Institute / Coaching name" />
        <Input compact icon={Mail} required type="email" value={f.email} onChange={set('email')} placeholder="Email address" />

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input compact icon={Lock} required type="password" value={f.password} onChange={set('password')} minLength={6} placeholder="Password" />
          <Input compact icon={Lock} required type="password" value={f.confirmPassword} onChange={set('confirmPassword')} minLength={6} placeholder="Confirm password" />
        </div>
      </div>

      <SubmitButton busy={busy} busyText="Creating account…">Create Account</SubmitButton>

      <SocialButtons />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="ml-1 font-bold text-royal hover:underline">Log In</Link>
      </p>

      <p className="mt-2 text-center text-xs text-slate-400">
        By signing up, you agree to EduManage Terms &amp; Privacy Policy.
      </p>
    </AuthShell>
  );
}
