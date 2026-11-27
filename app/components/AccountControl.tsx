'use client';
import Link from 'next/link';
import './account-menu.css';
import {useEffect,useState} from 'react';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';

export default function AccountControl(){
 const [db]=useState(()=>createClientComponentClient());
 const [state,setState]=useState<'loading'|'in'|'out'|'error'>('loading');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let alive=true,ticket=0;const timers=new Set<ReturnType<typeof setTimeout>>();
  async function refresh(){const current=++ticket;try{const result=await db.auth.getUser();if(!alive||current!==ticket)return;
   if(result.error&&result.error.name!=='AuthSessionMissingError'){setState('error');return;}
   setState(result.data.user?'in':'out');
  }catch{if(alive&&current===ticket)setState('error');}}
  void refresh();
  const {data:{subscription}}=db.auth.onAuthStateChange(event=>{
   if(event==='SIGNED_OUT'){ticket++;if(alive)setState('out');return;}
   const timer=setTimeout(()=>{timers.delete(timer);if(alive)void refresh();},0);timers.add(timer);
  });
  return()=>{alive=false;ticket++;subscription.unsubscribe();timers.forEach(clearTimeout);};
 },[db,retry]);
 async function logout(){
  if(busy||!window.confirm('Log out? Unsaved changes in this tab will be lost.'))return;
  setBusy(true);setError('');
  try{const {error}=await db.auth.signOut({scope:'local'});if(error)throw error;window.location.assign('/login?mode=signin&next=/workspace');}
  catch{setError('Could not log out. Please retry.');setBusy(false);}
 }
 return <div className="mfh-account-control" aria-label="Account">
  {state==='loading'?<span role="status">Checking account…</span>:state==='in'?<details className="mfh-account-menu"><summary>Account</summary><nav aria-label="Account options"><Link href="/settings">Profile</Link><Link href="/settings/notifications">Notification preferences</Link><Link href="/settings/security">Security</Link><button type="button" disabled={busy} onClick={logout}>{busy?'Logging out…':'Log out'}</button></nav></details>:state==='out'?<><Link href="/login?mode=signin&next=/workspace">Log in</Link><Link className="mfh-login-button" href="/login?mode=signup&next=/workspace/setup">Create an account</Link></>:<><span>Account unavailable</span><button type="button" onClick={()=>{setState('loading');setRetry(n=>n+1);}}>Retry account check</button><Link href="/login?mode=signin&next=/workspace">Log in</Link></>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
