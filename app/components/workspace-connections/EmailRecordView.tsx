'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';
import WorkspaceNav from '../WorkspaceNav';
import {EmailHistoryRecord,findEmailRecord} from '../../lib/emailRecordLookup';
import '../workspace-editorial.css';
import './connections.css';

const statuses:Record<string,string>={failed:'Not sent / provider rejected',bounced:'Provider reports bounced',unknown:'Delivery unknown — review required; do not resend',retry:'Provider rate limited — retry pending',queued:'Queued — not sent',leased:'Preparing',sending:'Sending — outcome pending',accepted:'Provider accepted — not delivery confirmation',delivered:'Provider reports delivered',canceled:'Canceled before send'};
export default function EmailRecordView({id}:{id:string}){
 const [db]=useState(()=>createClientComponentClient());
 const [record,setRecord]=useState<EmailHistoryRecord|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const actor=useRef<string|null>(null),active=useRef<AbortController|null>(null);
 useEffect(()=>{
  const invalidate=()=>{active.current?.abort();setRecord(null);setLoading(true);setRevision(n=>n+1);};
  const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'||(event==='SIGNED_IN'&&!actor.current)||(actor.current&&session?.user?.id!==actor.current)) {actor.current=null;invalidate();}
  });
  const visible=()=>{if(document.visibilityState==='visible')invalidate();};
  window.addEventListener('focus',invalidate);document.addEventListener('visibilitychange',visible);
  return()=>{subscription.unsubscribe();window.removeEventListener('focus',invalidate);document.removeEventListener('visibilitychange',visible);};
 },[db]);
 useEffect(()=>{
  const controller=new AbortController();active.current=controller;setRecord(null);setLoading(true);setError('');
  async function load(){try{
   const {data:{user},error:authError}=await db.auth.getUser();
   if(controller.signal.aborted)return;
   if(authError||!user)throw Error('Sign in to inspect this message.');
   actor.current=user.id;
   const result=await findEmailRecord(user.id,id,controller.signal);
   if(!controller.signal.aborted)setRecord(result);
  }catch(e){if(!controller.signal.aborted)setError((e as Error).message);}
  finally{if(!controller.signal.aborted)setLoading(false);}}
  void load();return()=>controller.abort();
 },[db,id,revision]);
 const created=record&&Number.isFinite(Date.parse(record.createdAt))?new Date(record.createdAt).toISOString().replace('T',' ').replace('.000Z',' UTC'):null;
 return <div className="editorial-shell"><WorkspaceNav active="connections"/><main className="editorial-main connections-main">
  <nav aria-label="Breadcrumb"><Link href="/workspace">Overview</Link> / <Link href="/workspace/connections">Connections</Link> / <span aria-current="page">Message details</span></nav>
  <h1 tabIndex={-1}>Message details</h1>
  <p>This view is read-only. Opening it does not send, resend or cancel a message.</p>
  {loading?<p role="status">Loading message…</p>:error?<div role="alert"><p>{error}</p><button onClick={()=>setRevision(n=>n+1)}>Retry</button> <Link href="/login">Sign in</Link></div>:!record?<p role="status">Message unavailable. It may no longer exist or you may not have access.</p>:<section className="editorial-card" aria-label="Message details" style={{overflowWrap:'anywhere'}}>
   <h2>{record.template==='team-invitation.v1'?'Team invitation':record.template==='booking-reminder.v1'?'Booking reminder':'Transactional message'}</h2>
   <p><strong>{statuses[record.status]||'Status needs review'}</strong></p>
   <dl><dt>Recipient</dt><dd>{record.recipient}</dd><dt>Owner</dt><dd>You</dd><dt>Created</dt><dd>{created||'Date unavailable'}</dd></dl>
   <p>Created is the queue record date, not a failure or delivery time. Provider acceptance is not delivery confirmation.</p>
  </section>}
  <p><Link href="/workspace/connections">Email delivery history</Link> · <Link href="/workspace">Overview</Link></p>
 </main></div>;
}
