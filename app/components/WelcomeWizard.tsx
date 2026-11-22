'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function WelcomeWizard({ onComplete }: { onComplete?: () => void }) {
  const db = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const actor = useRef<string | null>(null);
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [destination, setDestination] = useState('/create');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const previousFocus = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    (async () => {
      try {
        const { data: { user }, error: authError } = await db.auth.getUser();
        if (!user || authError) throw Error('Please sign in again before saving your profile.');
        const { data, error: readError } = await db.from('profiles').select('full_name,business_name').eq('id', user.id).single();
        if (readError) throw Error('Your profile could not be loaded. Try again later; your saved details have not changed.');
        if (active) { actor.current = user.id; setName(data.full_name || ''); setBusiness(data.business_name || ''); }
      } catch (e) { if (active) setError((e as Error).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; previousFocus?.focus(); };
  }, [db]);
  const dismiss = () => { if (!saving) { dialog.current?.close(); onComplete?.(); } };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving || loading || !actor.current) return;
    if (!name.trim()) { setError('Enter the name you want clients to see.'); return; }
    setSaving(true); setError('');
    try {
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || user?.id !== actor.current) throw Error('Your account changed. Reopen setup in the original account; nothing was saved.');
      const { error: saveError } = await db.from('profiles').update({ full_name: name.trim(), business_name: business.trim(), has_completed_onboarding: true }).eq('id', actor.current).select('id').single();
      if (saveError) throw Error('Your profile could not be saved. Your entries are still here—please retry.');
      // Completing setup does not enroll, charge, connect Stripe or send an email.
      dialog.current?.close(); onComplete?.(); router.push(destination);
    } catch (e) { setError((e as Error).message); setSaving(false); }
  }
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); dismiss(); }} aria-labelledby="welcome-title" aria-describedby="welcome-description" className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-[#cad6ca] bg-[#fbfcfa] p-0 text-[#183e34] shadow-xl backdrop:bg-black/50">
    <form onSubmit={save} className="p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between gap-4"><span className="font-bold">MicroFreelanceHub</span><button type="button" onClick={dismiss} disabled={saving} className="min-h-[44px] px-3 underline disabled:opacity-50">Set up later</button></div>
      <div><p className="text-xs uppercase tracking-widest mb-2">Your first useful step</p><h2 id="welcome-title" className="text-2xl font-bold">Start with one client. Keep the next step clear.</h2><p id="welcome-description" className="mt-3 text-sm leading-relaxed">Add your name, then choose what you want to do. Payment setup can wait until you need it.</p></div>
      {loading && <p role="status">Loading your saved profile…</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      <div><label htmlFor="welcome-name" className="block text-sm font-semibold mb-2">Your name</label><input id="welcome-name" autoComplete="name" required maxLength={160} disabled={loading || saving || !actor.current} value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-[#91a999] bg-white p-3 text-slate-900 focus:outline-2 focus:outline-[#194d41]" /></div>
      <div><label htmlFor="welcome-business" className="block text-sm font-semibold mb-2">Business name <span className="font-normal">(optional)</span></label><input id="welcome-business" autoComplete="organization" maxLength={160} disabled={loading || saving || !actor.current} value={business} onChange={e => setBusiness(e.target.value)} className="w-full rounded-lg border border-[#91a999] bg-white p-3 text-slate-900 focus:outline-2 focus:outline-[#194d41]" /></div>
      <fieldset disabled={saving}><legend className="font-semibold mb-2">What would help you right now?</legend>{[['/create','Draft an agreement','Outline the scope, approvals and payment steps.'],['/workspace/clients','Organize a client project','Keep client details, tasks and agreements together.']].map(([value,title,description]) => <label key={value} className="flex gap-3 rounded-lg border border-[#cad6ca] p-3 mb-2 cursor-pointer"><input type="radio" name="first-action" value={value} checked={destination===value} onChange={() => setDestination(value)} className="mt-1"/><span><strong className="block text-sm">{title}</strong><span className="text-sm">{description}</span></span></label>)}</fieldset>
      <button type="submit" disabled={loading || saving || !actor.current} className="min-h-[48px] w-full rounded-lg bg-[#194d41] px-4 py-3 font-semibold text-white hover:bg-[#123c32] disabled:opacity-50">{saving ? 'Saving your profile…' : 'Save and continue'}</button>
      <p className="text-xs leading-relaxed">This step does not create a subscription or connect a payment account. You can change these details in Settings.</p>
    </form>
  </dialog>;
}
