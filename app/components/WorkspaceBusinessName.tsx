'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';
import {workspacePreferences} from '../lib/workspaceExperience';

// The private workspace is scoped to the authenticated account, not a selected team.
// Keep the existing setup endpoint as the single writer; do not dual-write profiles.
export default function WorkspaceBusinessName({id, legacyCompany}: {id: string; legacyCompany?: string}) {
  const db = useMemo(() => createClientComponentClient(), []);
  const [name, setName] = useState('');
  const [state, setState] = useState<'loading'|'ready'|'error'>('loading');
  useEffect(() => {
    let alive = true, generation = 0, actor = '';
    async function load() {
      const ticket = ++generation;
      setName(''); setState('loading');
      try {
        const first = await db.auth.getUser();
        if (first.error || !first.data.user) throw Error('Signed out');
        actor = first.data.user.id;
        const r = await fetch('/api/workspace-preferences', {cache:'no-store'}), b = await r.json();
        const last = await db.auth.getUser();
        if (!r.ok || b.ownerId !== actor || last.error || last.data.user?.id !== actor) throw Error('Account changed');
        const preferences = workspacePreferences(b.preferences);
        if (b.preferences !== null && !preferences) throw Error('Invalid setup');
        if (alive && ticket === generation) {setName(preferences?.business || ''); setState('ready');}
      } catch {if (alive && ticket === generation) {setName(''); setState('error');}}
    }
    const {data:{subscription}} = db.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (actor && session?.user?.id !== actor)) {
        ++generation; actor = ''; setName(''); setState('error');
      }
    });
    void load();
    return () => {alive = false; ++generation; subscription.unsubscribe();};
  }, [db]);
  return <div>
    <label htmlFor={id} className="block text-sm font-semibold mb-2">Workspace business name</label>
    <input id={id} value={name} readOnly aria-describedby={id+'-help'} className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-slate-900" />
    <p id={id+'-help'} className="mt-2 text-sm">
      {state === 'loading' ? 'Loading workspace name…' : state === 'error' ? 'Workspace name unavailable. Reload in the intended account.' : name ? 'Saved in workspace setup for this account.' : 'No workspace business name saved yet.'}
      {' '}<Link href="/workspace/setup?edit=1" className="underline">Edit business name in workspace setup</Link>
    </p>
    {state === 'ready' && legacyCompany && legacyCompany !== name && <p className="mt-2 text-sm">Previous profile company name (retained): {legacyCompany}. This separate saved value has not been changed.</p>}
  </div>;
}
