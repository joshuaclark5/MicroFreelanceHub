'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import ClientViewPreview from './ClientViewPreview';
import {sampleClient,sampleClientKey,readSampleClient,saveSampleClient} from '../lib/sampleClientPractice';

export default function SampleClientPractice({actorId}:{actorId:string}){
 const [state,setState]=useState<{actor:string;selected:boolean}|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{setState(null);setError('');setNotice('');
  const load=()=>{try{setState({actor:actorId,selected:readSampleClient(window.localStorage,actorId)});setError('');}catch{setError('Sample practice is unavailable in this browser. Allow browser storage, then retry.');}};
  load();const sync=(event:StorageEvent)=>{if(event.key===null||event.key===sampleClientKey(actorId))load();};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[actorId,revision]);
 const current=state?.actor===actorId?state:null;
 function choose(selected:boolean){if(!current)return;setError('');setNotice('');try{setState({actor:actorId,selected:saveSampleClient(window.localStorage,actorId,selected)});setNotice(selected?'Sample client ready. Your live client list is unchanged.':'Sample removed. Your saved setup and live records are unchanged.');}catch{setError('Could not confirm the sample change. Your previous displayed selection is kept. Please retry.');}}
 return <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-slate-900" aria-label="First client practice">
  <h2 className="text-lg font-semibold">Start with a client</h2><p className="my-3 text-sm text-slate-600">Create a client for real work, or practice with a fictional sample. The sample stays in this browser and is never included in live messages, billing or reports.</p>
  <div className="flex flex-wrap gap-3"><Link className="d4-secondary" href="/workspace/clients">Create a client</Link>{current&&!current.selected&&<button type="button" className="d4-secondary" onClick={()=>choose(true)}>Use a sample client</button>}</div>
  {!current&&!error&&<p role="status">Loading sample choice...</p>}
  {error&&<p role="alert" className="my-3">{error}{!current&&<button type="button" className="ml-2 underline" onClick={()=>setRevision(n=>n+1)}>Retry sample practice</button>}</p>}
  {notice&&<p role="status" className="my-3 text-sm">{notice}</p>}
  {current?.selected&&<article className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4" aria-label="Sample client record"><span className="text-xs font-semibold uppercase">Sample - practice only</span><h3 className="mt-2 font-semibold">{sampleClient.name}</h3><dl className="my-3 space-y-2 text-sm"><div><dt className="font-semibold">Example email</dt><dd>{sampleClient.email}</dd></div><div><dt className="font-semibold">Example project</dt><dd>{sampleClient.project}</dd></div><div><dt className="font-semibold">Example scope</dt><dd>{sampleClient.scope}</dd></div></dl><div className="flex flex-wrap gap-3"><ClientViewPreview triggerLabel="Preview this sample"/><button type="button" className="d4-secondary" onClick={()=>choose(false)}>Remove sample client</button></div><p className="mt-3 text-xs">This practice client does not complete the real First client setup step. Removing it only removes this browser's sample choice.</p></article>}
 </section>;
}
