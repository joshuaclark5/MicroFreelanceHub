'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {EmailHistoryRecord,failedEmailRecords} from '../../lib/emailRecordLookup';

export default function FailedEmailActions({actorId}:{actorId:string}){
 const [rows,setRows]=useState<EmailHistoryRecord[]|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setRows(null);setError('');
  async function load(){try{
   const result=await failedEmailRecords(actorId,controller.signal);
   const response=await fetch('/api/workspace/session',{cache:'no-store',signal:controller.signal,headers:{'x-workspace-owner':actorId}});
   const session=await response.json();
   if(!response.ok||session.ownerId!==actorId)throw Error('Account changed. Refresh your workspace.');
   if(!controller.signal.aborted)setRows(result);
  }catch(e){if(!controller.signal.aborted){setRows(null);setError((e as Error).message);}}}
  const refresh=()=>{controller.abort();setRows(null);setRevision(n=>n+1);};
  const visible=()=>{if(document.visibilityState==='visible')refresh();};
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
  void load();return()=>{controller.abort();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible);};
 },[actorId,revision]);
 return <section className="xp-panel" aria-labelledby="overview-failed-email"><div className="xp-panel-heading"><h2 id="overview-failed-email">Failed sends to review</h2><Link href="/workspace/connections">Email history</Link></div>
  <p>Review rejected or bounced messages. Opening a message does not resend it. Unknown outcomes and pending retries are separate statuses in email history.</p>
  {error?<div role="alert"><p>{error}</p><button onClick={()=>setRevision(n=>n+1)}>Retry email history</button></div>:rows===null?<p role="status">Loading email actions…</p>:rows.length===0?<p>No failed or bounced messages in your accessible email history.</p>:<>
   {rows.length>5&&<p>Showing the oldest 5 of {rows.length} failed or bounced messages. Open email history for more.</p>}
   {rows.slice(0,5).map(row=>{const created=Number.isFinite(Date.parse(row.createdAt))?new Date(row.createdAt).toISOString():null;return <Link className="xp-row" key={row.id} href={'/workspace/connections/messages/'+encodeURIComponent(row.id)} style={{overflowWrap:'anywhere'}}><div style={{minWidth:0}}><strong>{row.template==='team-invitation.v1'?'Team invitation':'Booking reminder'}</strong><small>{row.status==='bounced'?'Provider reports bounced':'Not sent / provider rejected'}</small><small>Owner: You</small><small>{created?<>Created <time dateTime={created}>{created.slice(0,10)} UTC</time></>:'Creation date unavailable'}</small><small>Review message</small></div></Link>;})}
   <p>Created is the queue record date, not a failure or delivery time.</p>
  </>}
 </section>;
}
