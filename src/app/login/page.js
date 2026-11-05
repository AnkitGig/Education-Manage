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
          <label className="flex cursor-pointer items-center gap-3 text-[15px] font-medium text-slate-900">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-5 w-5 rounded-md border-slate-300 text-violet-600 focus:ring-violet-300"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-[15px] font-bold text-violet-700 hover:underline">Forgot password?</Link>
        </div>
      )}

      <SubmitButton busy={busy}>{setup ? 'Create account' : 'Sign In'}</SubmitButton>

      <p className="mt-8 text-center text-[15px] text-slate-600">
        {setup ? 'This first account becomes the institute admin.' : (
          <>New to EduManage? <Link href="/signup" className="ml-1 font-bold text-violet-700 hover:underline">Create an account</Link></>
        )}
      </p>
    </AuthShell>
  );
}