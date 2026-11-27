'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';
import WorkspaceNav from '../../components/WorkspaceNav';

export default function AccountSecurity(){
 const [db]=useState(()=>createClientComponentClient());
 const [account,setAccount]=useState<{id:string;email:string}|null>(null);
 const [status,setStatus]=useState<'checking'|'ready'|'out'|'error'>('checking');
 const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const generation=useRef(0),flight=useRef(false);
 useEffect(()=>{
  let alive=true;const timers=new Set<ReturnType<typeof setTimeout>>();
  async function verify(){const ticket=++generation.current;setAccount(null);setSent(false);setError('');setStatus('checking');
   try{const result=await db.auth.getUser();if(!alive||ticket!==generation.current)return;
    if(result.error){setStatus(result.error.name==='AuthSessionMissingError'?'out':'error');return;}
    if(!result.data.user){setStatus('out');return;}
    setAccount({id:result.data.user.id,email:result.data.user.email||''});setStatus('ready');
   }catch{if(alive&&ticket===generation.current)setStatus('error');}
  }
  void verify();
  const {data:{subscription}}=db.auth.onAuthStateChange(event=>{
   if(event==='TOKEN_REFRESHED'||event==='INITIAL_SESSION')return;
   generation.current++;setAccount(null);setSent(false);setError('');
   if(event==='SIGNED_OUT'){setStatus('out');return;}
   setStatus('checking');const timer=setTimeout(()=>{timers.delete(timer);if(alive)void verify();},0);timers.add(timer);
  });
  return()=>{alive=false;generation.current++;subscription.unsubscribe();timers.forEach(clearTimeout);};
 },[db,retry]);
 async function requestReset(){
  if(flight.current||status!=='ready'||!account?.email||sent)return;
  flight.current=true;setBusy(true);setError('');const expected=account.id,ticket=generation.current;
  try{const result=await db.auth.getUser();if(ticket!==generation.current)return;
   if(result.error||!result.data.user||result.data.user.id!==expected||result.data.user.email!==account.email){setAccount(null);setStatus('error');setError('Your account could not be confirmed. Check your account again before requesting a link.');return;}
   const {error:sendError}=await db.auth.resetPasswordForEmail(result.data.user.email,{redirectTo:window.location.origin+'/login'});
   if(ticket!==generation.current)return;
   if(sendError)throw sendError;setSent(true);
  }catch{if(ticket===generation.current)setError('The reset request could not be confirmed. You can retry; check your inbox before requesting another link.');}
  finally{flight.current=false;setBusy(false);}
 }
 return <div className="d4-app-shell suite-shell"><WorkspaceNav active="settings"/><main className="suite-main p-5 sm:p-8">
  <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-sm"><Link href="/workspace" className="underline">Overview</Link><span aria-hidden="true">/</span><Link href="/settings" className="underline">Settings</Link><span aria-hidden="true">/</span><span aria-current="page">Security</span></nav>
  <h1 className="text-2xl font-semibold">Account security</h1>
  {status==='checking'&&<p role="status" className="mt-4">Checking your account…</p>}
  {status==='out'&&<p className="mt-4">Sign in to manage your account. <Link className="underline" href="/login?mode=signin&next=%2Fsettings%2Fsecurity">Sign in</Link></p>}
  {status==='error'&&<div className="mt-4"><p role="alert">{error||'Account unavailable. Verify your account before requesting a reset link.'}</p><button type="button" className="mt-3 rounded border px-4 py-3" onClick={()=>setRetry(n=>n+1)}>Check account again</button></div>}
  {status==='ready'&&account&&<section className="mt-6 max-w-xl rounded-xl border p-5"><h2 className="text-xl font-semibold">Password recovery</h2>
   {account.email?<><p className="mt-3 break-words">Account email: {account.email}</p><p className="mt-3">Request a password-reset link for this account. The existing sign-in recovery flow will let you choose a new password. This does not change your password now.</p>
    <button type="button" disabled={busy||sent} onClick={()=>void requestReset()} className="mt-4 rounded border border-slate-500 px-4 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">{busy?'Requesting link…':sent?'Reset requested':'Request password-reset link'}</button>
    {sent&&<p role="status" className="mt-3">Request accepted. Check your email for the reset link. Email delivery is not confirmed here.</p>}
    {error&&<p role="alert" className="mt-3">{error}</p>}</>:<p className="mt-3">This account has no email available for password recovery. Use your existing sign-in provider.</p>}
  </section>}
 </main></div>;
}
