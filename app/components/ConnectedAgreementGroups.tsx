'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
// Optional additive bridge: legacy agreement listing remains usable before schema rollout.
export default function ConnectedAgreementGroups(){
 const [groups,setGroups]=useState<{id:string;name:string;client:string;count:number}[]>([]),[state,setState]=useState('loading');
 async function load(){setState('loading');try{
  const results=await Promise.all(['clients','projects','agreements'].map(async entity=>{const r=await fetch('/api/workspace/'+entity,{cache:'no-store'});const b=await r.json();if(!r.ok||!Array.isArray(b.records)||b.truncated)throw Error();return b.records;}));
  const [clients,projects,links]=results;setGroups(projects.map((p:any)=>({id:p.id,name:p.name,client:clients.find((c:any)=>c.id===p.client_id)?.name||'Client unavailable',count:links.filter((l:any)=>l.project_id===p.id).length})));setState('ready');
 }catch{setState('error');}}
 useEffect(()=>{load();},[]);
 return <section className="rounded-lg border border-gray-200 bg-white p-4" aria-label="Connected client projects"><h2 className="text-lg font-semibold">Connected client projects</h2>{state==='loading'?<p role="status">Loading saved project links…</p>:state==='error'?<p>Project links are unavailable. Your agreements below are unchanged. <button type="button" className="underline" onClick={load}>Retry project links</button></p>:groups.length?<ul className="mt-3 space-y-2">{groups.map(g=><li key={g.id} className="break-words"><Link className="underline" href={'/workspace/projects?project='+g.id}>{g.name}</Link> · {g.client} · {g.count} linked agreements</li>)}</ul>:<p className="mt-2">No projects linked yet. Add a client and project, then explicitly link its agreement.</p>}<Link className="inline-block mt-3 text-sm underline" href="/workspace/clients">Manage clients &amp; projects →</Link></section>;
}
