'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
type Entry={id:string;source:string;kind:string;body:string;created_at:string;author_id:string;author_name:string|null;opportunity_id:string|null;title:string|null};
type Pending={clientId:string;body:string;operationId:string;expectedActorId:string};
export type TimelineDraft={body:string;pending:Pending|null};
export default function ClientTimeline({clientId,clientName,ownerId,drafts}:{clientId:string;clientName:string;ownerId:string;drafts:Map<string,TimelineDraft>}){
 const draftKey=ownerId+':'+clientId;
 const retained=drafts.get(draftKey);
 const [open,setOpen]=useState(false),[records,setRecords]=useState<Entry[]>([]),[truncated,setTruncated]=useState(false),[body,setBody]=useState(retained?.body||''),[pending,setPending]=useState<Pending|null>(retained?.pending||null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[verified,setVerified]=useState(false);
 const generation=useRef(0),alive=useRef(true),saving=useRef(false);
 function remember(nextBody:string,nextPending:Pending|null){drafts.set(draftKey,{body:nextBody,pending:nextPending});setBody(nextBody);setPending(nextPending);}
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 async function load(){
 const ticket=++generation.current;setLoading(true);setError('');setVerified(false);
 try{
 const response=await fetch('/api/workspace-client-timeline?clientId='+clientId,{cache:'no-store',headers:{'x-workspace-owner':ownerId}}),result=await response.json();
 if(!response.ok||result.actorId!==ownerId||!Array.isArray(result.records)||typeof result.truncated!=='boolean')throw Error(result.error||'Timeline could not be verified.');
 if(!alive.current||ticket!==generation.current)return;
 setRecords(result.records);setTruncated(result.truncated);setVerified(true);
 }catch(e){if(alive.current&&ticket===generation.current){setRecords([]);setError((e as Error).message);}}
 finally{if(alive.current&&ticket===generation.current)setLoading(false);}
 }
 useEffect(()=>{if(!open)return;load();const refresh=()=>{if(document.visibilityState==='visible'&&!saving.current)load();};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);generation.current++;};},[open]);
 async function save(){
 if(saving.current||!verified||loading)return;
 const operation=pending||{clientId,body,operationId:crypto.randomUUID(),expectedActorId:ownerId};
 remember(operation.body,operation);saving.current=true;setBusy(true);setError('');setNotice('');
 try{
 const response=await fetch('/api/workspace-client-timeline',{method:'POST',headers:{'Content-Type':'application/json','x-workspace-owner':ownerId},body:JSON.stringify(operation)}),result=await response.json();
 if(!response.ok||result.actorId!==ownerId||!result.record?.id)throw Error(result.error||'Save outcome is unconfirmed. Retry the same note.');
 if(!alive.current)return;
 remember('',null);setNotice('Note saved.');await load();
 }catch(e){if(alive.current){setError((e as Error).message);setVerified(false);setRecords([]);}}
 finally{saving.current=false;if(alive.current)setBusy(false);}
 }
 return <section className="client-timeline" aria-label={'Timeline for '+clientName}>
 <button type="button" aria-expanded={open} aria-controls={'timeline-'+clientId} disabled={busy} onClick={()=>setOpen(!open)}>{open?'Hide':'Open'} client timeline</button>
 {open&&<div id={'timeline-'+clientId}>
 <h3>Client timeline</h3><p>Separate client notes and saved opportunity activity. The editable client summary above is kept separately.</p>
 <p role="status">{loading?'Checking account and loading timeline…':notice}</p>
 {error&&<p role="alert">{error}</p>}
 <button type="button" disabled={busy||loading} onClick={load}>Refresh timeline and check account</button>
 {verified&&<><form onSubmit={e=>{e.preventDefault();save();}}>
 <label htmlFor={'note-'+clientId}>New note for {clientName}</label>
 <textarea id={'note-'+clientId} value={pending?.body??body} maxLength={2000} rows={3} required disabled={busy||!!pending} onChange={e=>remember(e.target.value,null)}/>
 {pending&&<p>This note is retained for an identical retry. A retry cannot create a second copy.</p>}
 <button type="submit" disabled={busy||loading||(!pending&&!body.trim())}>{busy?'Saving note…':pending?'Retry same note':'Add note'}</button>
 </form>
 {truncated&&<p role="status">Showing the latest 200 entries only. Older history is retained, not shown in this bounded view.</p>}
 {!records.length?<p>No timeline entries yet. Add the first note.</p>:<ol>{records.map(entry=><li key={entry.source+entry.id}>
 <p><strong>{entry.source==='client_note'?'Client note':'Opportunity '+entry.kind}</strong>{entry.title?' · '+entry.title:''}</p>
 <p>{entry.author_name||'Historical account owner (name was not recorded)'} · <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time></p>
 <small>Author account: {entry.author_id}</small>
 {entry.body&&<p className="suite-notes">{entry.body}</p>}
 {entry.opportunity_id&&<Link href="/workspace/crm">Open opportunity workspace</Link>}
 </li>)}</ol>}
 </>}
 </div>}
 </section>;
}
