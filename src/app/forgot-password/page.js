'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthShell, Input, Heading, SubmitButton } from '@/components/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    // Simulate/send reset request
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 800);
  };

  return (
    <AuthShell onSubmit={submit}>
      <Heading
        title="Reset Password"
        sub="Enter your email to receive password reset instructions"
      />

      {sent ? (
        <div className="mt-8 space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
            <p className="mt-1 text-sm text-slate-500">
              We have sent a password reset link to <strong className="text-slate-800">{email}</strong>.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-royal hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Log In
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-7 space-y-4">
            <Input
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />
          </div>

          <SubmitButton busy={busy} busyText="Sending link…">
            Send Reset Link
          </SubmitButton>

          <p className="mt-7 text-center text-sm text-slate-600">
            Remember your password?{' '}
            <Link href="/login" className="ml-1 font-bold text-royal hover:underline">
              Log In
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

