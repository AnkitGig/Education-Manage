'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { api, run } from '@/lib/client';
import { AuthShell, Input, Heading, SubmitButton, SocialButtons } from '@/components/auth';

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await run(() => api('/api/auth/login', 'POST', f));
    setBusy(false);
    if (r) router.replace('/dashboard');
  };

  return (
    <AuthShell onSubmit={submit} isLogin>
      <Heading
        title={<>Welcome Back <span className="inline-block text-[26px]">👋</span></>}
        sub="Log in to your EduManage account"
      />

      <div className="mt-7 space-y-3.5">
        <Input
          icon={Mail}
          type="email"
          value={f.email}
          onChange={set('email')}
          placeholder="Email address"
          required
        />
        <Input
          icon={Lock}
          type="password"
          value={f.password}
          onChange={set('password')}
          minLength={6}
          placeholder="Password"
          required
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-royal focus:ring-royal/20"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-[14px] font-semibold text-royal hover:underline">
          Forgot password?
        </Link>
      </div>

      <SubmitButton busy={busy}>Log In</SubmitButton>

      <SocialButtons />

      <p className="mt-8 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="ml-1 font-bold text-royal hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthShell>
  );
}
