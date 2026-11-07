'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Building2 } from 'lucide-react';
import { api, run } from '@/lib/client';
import { AuthShell, Input, Heading, SubmitButton } from '@/components/auth';

export default function Login() {
  const router = useRouter();
  const [setup, setSetup] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', institute: '' });
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { fetch('/api/setup').then((r) => r.json()).then((j) => setSetup(!!j.needsSetup)).catch(() => { }); }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const r = await run(() => api(setup ? '/api/setup' : '/api/auth/login', 'POST', f));
    setBusy(false);
    if (r) router.replace('/dashboard');
  };

  return (
    <AuthShell onSubmit={submit}>
      <Heading
        title={setup ? 'Set up your institute' : <>Welcome Back <span className="inline-block">👋</span></>}
        sub={setup ? 'Create the admin account to get started' : 'Sign in to manage your institute'}
      />

      <div className="mt-7 space-y-4">
        {setup && <>
          <Input icon={Building2} value={f.institute} onChange={set('institute')} placeholder="Institute name" required />
          <Input icon={User} value={f.name} onChange={set('name')} placeholder="Your name" required />
        </>}
        <Input icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder="Email address" required />
        <Input icon={Lock} type="password" value={f.password} onChange={set('password')} minLength={6} placeholder="Password" required />
      </div>

      {!setup && (
        <div className="mt-5 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-royal focus:ring-royal/20"
            />
            Remember me
          </label>
          <Link href="/signup" className="text-sm font-semibold text-royal hover:underline">Need help?</Link>
        </div>
      )}

      <SubmitButton busy={busy}>{setup ? 'Create account' : 'Sign In'}</SubmitButton>

      <p className="mt-7 text-center text-sm text-slate-600">
        {setup ? 'This first account becomes the institute admin.' : (
          <>Don&apos;t have an account? <Link href="/signup" className="ml-1 font-semibold text-royal hover:underline">Get started free</Link></>
        )}
      </p>
    </AuthShell>
  );
}