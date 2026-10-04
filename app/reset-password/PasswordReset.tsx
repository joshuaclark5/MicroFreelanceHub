'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function PasswordReset() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const verify = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (active) setState(!error && data.user ? 'ready' : 'invalid');
    };
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => { if (active) void verify(); }, 0);
    });
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const recoveryHash = new URLSearchParams(url.hash.slice(1));
    const timer = setTimeout(() => { if (active) setState(current => current === 'checking' ? 'invalid' : current); }, 15000);
    if (url.searchParams.has('error') || recoveryHash.has('error')) setState('invalid');
    else if (code) {
      // The browser auth helper exchanges PKCE codes during initialization.
      // Await that work; a second exchange would consume the same code twice.
      void supabase.auth.getSession().then(async ({ data, error }) => {
        window.history.replaceState({}, '', '/reset-password');
        if (error || !data.session) { if (active) setState('invalid'); } else await verify();
      }).catch(() => { if (active) setState('invalid'); });
    } else if (recoveryHash.get('type') !== 'recovery') setState('invalid');
    return () => { active = false; clearTimeout(timer); listener.subscription.unsubscribe(); };
  }, [supabase]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || state !== 'ready') return;
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !data.user) { setState('invalid'); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError('The password could not be updated. Try a different password or request a new reset link.'); return; }
      setPassword(''); setConfirmation(''); setState('done');
      window.history.replaceState({}, '', '/reset-password');
    } catch { setError('Connection interrupted. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
    <Link href="/" className="font-semibold">MicroFreelanceHub</Link><h1 className="mt-6 text-2xl font-semibold">Reset your password</h1>
    {state === 'checking' && <p role="status" className="mt-4">Checking your reset link…</p>}
    {state === 'invalid' && <div role="alert" className="mt-4"><p>This reset link is missing, expired or invalid. Request a new link from the sign-in page.</p><Link href="/login?mode=signin" className="d4-primary mt-5">Return to sign in</Link></div>}
    {state === 'done' && <div role="status" className="mt-4"><p>Your password has been updated.</p><Link href="/dashboard" className="d4-primary mt-5">Continue to dashboard</Link></div>}
    {state === 'ready' && <form onSubmit={submit} className="mt-6 space-y-5"><label className="block text-sm font-semibold">New password<input autoComplete="new-password" type="password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 p-3" /></label><p className="text-sm text-slate-600">Use at least 8 characters.</p><label className="block text-sm font-semibold">Confirm new password<input autoComplete="new-password" type="password" minLength={8} maxLength={128} required value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 p-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="d4-primary w-full">{busy ? 'Updating…' : 'Update password'}</button></form>}
  </section></main>;
}
