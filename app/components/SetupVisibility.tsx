'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';

/** Personal display preference only. Never changes business records or completion. */
export default function SetupVisibility({actorId,children}:{actorId:string;children:ReactNode}){
 const [dismissed,setDismissed]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const generation=useRef(0),flight=useRef(false);
 useEffect(()=>{const ticket=++generation.current,controller=new AbortController();setDismissed(null);setError('');
  void (async()=>{try{const r=await fetch('/api/workspace-preferences',{cache:'no-store',signal:controller.signal}),body=await r.json();
   if(ticket!==generation.current)return;
   if(!r.ok||body.ownerId!==actorId||typeof body.setupDismissed!=='boolean')throw Error('Unable to load your setup preference.');
   setDismissed(body.setupDismissed);
  }catch{if(ticket===generation.current)setError('Unable to load your setup preference.');}})();
  return()=>{generation.current++;controller.abort();};
 },[actorId,revision]);
 async function change(value:boolean){if(flight.current||dismissed===null)return;const ticket=generation.current;flight.current=true;setBusy(true);setError('');
  try{const r=await fetch('/api/workspace-preferences',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedOwner:actorId,setupDismissed:value})}),body=await r.json();
   if(ticket!==generation.current)return;
   if(!r.ok||body.ownerId!==actorId||body.setupDismissed!==value)throw Error('Setup visibility was not confirmed. Your saved records are unchanged. Please retry.');
   setDismissed(value);
  }catch(e){if(ticket===generation.current)setError((e as Error).message);}
  finally{flight.current=false;if(ticket===generation.current)setBusy(false);}
 }
 return <section className="xp-panel" aria-label="Setup visibility">
  {error&&<p role="alert">{error}</p>}
  {dismissed===null?(error?<button type="button" onClick={()=>setRevision(n=>n+1)}>Retry setup preference</button>:<p role="status">Loading setup preference...</p>):dismissed?<><h2>Setup is hidden</h2><p>Your saved details and completed steps are unchanged.</p><button type="button" disabled={busy} onClick={()=>void change(false)}>{busy?'Saving...':'Reopen setup'}</button></>:<><button type="button" disabled={busy} onClick={()=>void change(true)}>{busy?'Saving...':'Dismiss setup'}</button>{children}</>}
 </section>;
}
